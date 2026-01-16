export interface StylesheetOptions {
    href: string;
    media?: string;
}
/**
 * Represents a dynamically loadable <link rel="stylesheet"> element.
 * Provides an easy way to append a stylesheet to the document and await its loading.
 */
export declare class Stylesheet {
    /** The underlying HTMLLinkElement */
    element: HTMLLinkElement;
    readonly href: string;
    readonly media: string;
    /** Tracks whether the stylesheet has finished loading */
    private loaded;
    constructor(config: StylesheetOptions);
    /**
     * Adds or updates an attribute on the stylesheet element.
     * Safe to call even after appending to the document.
     */
    setAttribute(name: string, value: string): void;
    /**
     * Appends the stylesheet to the document head and returns a Promise
     * that resolves when the stylesheet has finished loading.
     * If the stylesheet already exists or is loaded, resolves immediately.
     */
    load(): Promise<void>;
    /**
     * Checks if a stylesheet with the given href already exists in the document.
     * @param href - The href of the stylesheet to check
     */
    static exists(href: string): boolean;
}
export default Stylesheet;
