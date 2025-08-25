export interface ScriptOptions {
  src: string;
  type?: "module" | "text/javascript";
  async?: boolean;
  defer?: boolean;
}

/**
 * Represents a dynamically loadable <script> element.
 * Provides an easy way to append a script to the document and await its loading.
 */
export default class Script {
  /** The underlying HTMLScriptElement instance */
  public element: HTMLScriptElement;
  /** Tracks whether the script has finished loading */
  private loaded = false;

  /**
   * Creates a new Script instance.
   * If a script with the same `src` already exists in the document, it reuses it.
   *
   * @param options - Configuration for the script element.
   * @param options.src - The URL of the script to load.
   * @param options.type - The script type, e.g. "module" or "text/javascript". Defaults to "text/javascript".
   * @param options.async - Whether the script should be loaded asynchronously.
   * @param options.defer - Whether the script should defer execution until after parsing.
   */
  constructor(config: ScriptOptions) {
    // Avoid adding the same script twice
    const existing = Array.from(document.querySelectorAll("script")).find(
      (el) => el.src === config.src,
    );
    if (existing) {
      this.element = existing as HTMLScriptElement;
      this.loaded = (this.element as any)._scriptLoaded || false;
      return;
    }

    this.element = document.createElement("script");
    this.element.src = config.src;
    this.element.type = config.type ?? "text/javascript";
    if (config.async) this.element.async = true;
    if (config.defer) this.element.defer = true;
  }

  /**
   * Adds or updates an attribute on the script element.
   *
   * @param name - The attribute name.
   * @param value - The attribute value.
   */
  public setAttribute(name: string, value: string) {
    this.element.setAttribute(name, value);
  }

  /**
   * Appends the script to the document head and returns a Promise
   * that resolves when the script finishes loading.
   * If the script is already loaded, resolves immediately.
   *
   * @returns A Promise that resolves when the script is loaded.
   * @throws If the script fails to load.
   */
  public load(): Promise<void> {
    if (this.loaded) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      this.element.onload = () => {
        this.loaded = true;
        // mark the element to avoid reloading
        (this.element as any)._scriptLoaded = true;
        resolve();
      };
      this.element.onerror = (err) => reject(err);

      document.head.appendChild(this.element);
    });
  }
}
