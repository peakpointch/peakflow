export interface ScriptOptions {
  src: string;
  type?: "module" | "text/javascript";
  async?: boolean;
  defer?: boolean;
  attributes?: Record<string, string | null | undefined>;
}

/**
 * Represents a dynamically loadable <script> element.
 * Provides an easy way to append a script to the document and await its loading.
 */
export class Script {
  /** The underlying HTMLScriptElement instance */
  public element: HTMLScriptElement;
  public readonly src: string;
  public readonly type: string;
  public readonly async: boolean;
  public readonly defer: boolean;
  /** Tracks whether the script has finished loading */
  private _loaded: boolean = false;
  public get loaded(): boolean {
    return this._loaded;
  }
  private set loaded(value: boolean) {
    this._loaded = value;
  }

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
    // Check if script already exists in the DOM
    const existing = Array.from(document.querySelectorAll<HTMLScriptElement>("script")).find(
      (el) => el.src === config.src,
    );
    if (existing) {
      this.element = existing;
      this.loaded = (this.element as any)._scriptLoaded || false;
    } else {
      // Create new script element
      this.element = document.createElement("script");
      this.element.async = config.async ?? false;
      this.element.defer = config.defer ?? false;
      this.element.type = config.type ?? "text/javascript";
      this.element.src = config.src;
    }

    // Initialize readonly properties
    this.src = this.element.src;
    this.type = this.element.type;
    this.async = this.element.async;
    this.defer = this.element.defer;

    this.setAttributes(config.attributes ?? {});
  }

  /**
   * Adds or updates multiple attributes on the script element.
   * Passing `null` or `undefined` sets the attribute to an empty string.
   *
   * @param attributes - Object mapping attribute names to values.
   */
  public setAttributes(attributes: Record<string, string | null | undefined>): void {
    for (const [name, value] of Object.entries(attributes)) {
      this.setAttribute(name, value);
    }
  }

  /**
   * Removes one or more attributes from the script element.
   *
   * @param attributes - Attribute names to remove.
   */
  public removeAttributes(...attributes: string[]): void {
    for (const attribute of attributes) {
      this.removeAttribute(attribute);
    }
  }

  /**
   * Adds or updates an attribute on the script element.
   * Passing `null` or `undefined` sets the attribute to an empty string. It does not remove the attribute.
   *
   * @param name - The attribute name.
   * @param value - The attribute value.
   */
  public setAttribute(name: string, value?: string): void {
    this.element.setAttribute(name, value ?? "");
  }

  /**
   * Removes an attribute on the script element.
   *
   * @param name - The attribute name.
   */
  public removeAttribute(name: string): void {
    this.element.removeAttribute(name);
  }

  /**
   * Appends the script to the document head and returns a Promise
   * that resolves when the script finishes loading.
   * If the script is already loaded or exists in the DOM, resolves immediately.
   *
   * @returns A Promise that resolves when the script is loaded.
   * @throws If the script fails to load.
   */
  public async load(): Promise<void> {
    if (this.loaded || Script.exists(this.src)) {
      this.loaded = true;
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      this.element.onload = () => {
        this.loaded = true;
        (this.element as any)._scriptLoaded = true;
        resolve();
      };
      this.element.onerror = (err) => reject(err);

      document.head.appendChild(this.element);
    });
  }

  /**
   * Checks if a script with the given URL already exists in the document.
   * @param url - The src of the script to check
   */
  static exists(url: string): boolean {
    return Array.from(document.querySelectorAll("script")).some((el) =>
      (el as HTMLScriptElement).src.includes(url),
    );
  }
}

export default Script;
