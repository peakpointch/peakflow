/**
 * Represents a dynamically loadable <link rel="stylesheet"> element.
 * Provides an easy way to append a stylesheet to the document and await its loading.
 */
export default class Stylesheet {
    constructor(config) {
        /** Tracks whether the stylesheet has finished loading */
        this.loaded = false;
        // Check if the stylesheet already exists in the DOM
        const existing = Array.from(document.querySelectorAll("link[rel=stylesheet]")).find((el) => el.href === config.href);
        if (existing) {
            this.element = existing;
            this.loaded = this.element._stylesheetLoaded || false;
        }
        else {
            // Create new link element
            this.element = document.createElement("link");
            this.element.rel = "stylesheet";
            this.element.href = config.href;
            if (config.media)
                this.element.media = config.media;
        }
        this.href = this.element.href;
        this.media = this.element.media;
    }
    /**
     * Adds or updates an attribute on the stylesheet element.
     * Safe to call even after appending to the document.
     */
    setAttribute(name, value) {
        this.element.setAttribute(name, value);
    }
    /**
     * Appends the stylesheet to the document head and returns a Promise
     * that resolves when the stylesheet has finished loading.
     * If the stylesheet already exists or is loaded, resolves immediately.
     */
    load() {
        if (this.loaded || Stylesheet.exists(this.href)) {
            this.loaded = true;
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            this.element.onload = () => {
                this.loaded = true;
                this.element._stylesheetLoaded = true;
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
    static exists(href) {
        return Array.from(document.querySelectorAll("link[rel=stylesheet]")).some((el) => el.href.includes(href));
    }
}
