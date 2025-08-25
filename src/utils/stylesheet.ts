export interface StylesheetOptions {
  href: string;
  media?: string;
}

/**
 * Represents a dynamically loadable <link rel="stylesheet"> element.
 * Provides an easy way to append a stylesheet to the document and await its loading.
 */
export default class Stylesheet {
  /** The underlying HTMLLinkElement */
  public element: HTMLLinkElement;

  public readonly href: string;
  public readonly media: string;

  /** Tracks whether the stylesheet has finished loading */
  private loaded = false;

  constructor(config: StylesheetOptions) {
    // Check if the stylesheet already exists in the DOM
    const existing = Array.from(document.querySelectorAll("link[rel=stylesheet]")).find(
      (el) => (el as HTMLLinkElement).href === config.href,
    );

    if (existing) {
      this.element = existing as HTMLLinkElement;
      this.loaded = (this.element as any)._stylesheetLoaded || false;
    } else {
      // Create new link element
      this.element = document.createElement("link");
      this.element.rel = "stylesheet";
      this.element.href = config.href;
      if (config.media) this.element.media = config.media;
    }

    this.href = this.element.href;
    this.media = this.element.media;
  }

  /**
   * Adds or updates an attribute on the stylesheet element.
   * Safe to call even after appending to the document.
   */
  public setAttribute(name: string, value: string) {
    this.element.setAttribute(name, value);
  }

  /**
   * Appends the stylesheet to the document head and returns a Promise
   * that resolves when the stylesheet has finished loading.
   * If the stylesheet already exists or is loaded, resolves immediately.
   */
  public load(): Promise<void> {
    if (this.loaded || Stylesheet.exists(this.href)) {
      this.loaded = true;
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      this.element.onload = () => {
        this.loaded = true;
        (this.element as any)._stylesheetLoaded = true;
        resolve();
      };
      this.element.onerror = (err) => reject(new Error(`Failed to load stylesheet: ${this.href}`));

      document.head.appendChild(this.element);
    });
  }

  /**
   * Checks if a stylesheet with the given href already exists in the document.
   * @param href - The href of the stylesheet to check
   */
  static exists(href: string): boolean {
    return Array.from(document.querySelectorAll("link[rel=stylesheet]")).some((el) =>
      (el as HTMLLinkElement).href.includes(href),
    );
  }
}
