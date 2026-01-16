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
export declare class Script {
    /** The underlying HTMLScriptElement instance */
    element: HTMLScriptElement;
    readonly src: string;
    readonly type: string;
    readonly async: boolean;
    readonly defer: boolean;
    /** Tracks whether the script has finished loading */
    private _loaded;
    get loaded(): boolean;
    private set loaded(value);
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
    constructor(config: ScriptOptions);
    /**
     * Adds or updates multiple attributes on the script element.
     * Passing `null` or `undefined` sets the attribute to an empty string.
     *
     * @param attributes - Object mapping attribute names to values.
     */
    setAttributes(attributes: Record<string, string | null | undefined>): void;
    /**
     * Removes one or more attributes from the script element.
     *
     * @param attributes - Attribute names to remove.
     */
    removeAttributes(...attributes: string[]): void;
    /**
     * Adds or updates an attribute on the script element.
     * Passing `null` or `undefined` sets the attribute to an empty string. It does not remove the attribute.
     *
     * @param name - The attribute name.
     * @param value - The attribute value.
     */
    setAttribute(name: string, value?: string): void;
    /**
     * Removes an attribute on the script element.
     *
     * @param name - The attribute name.
     */
    removeAttribute(name: string): void;
    /**
     * Appends the script to the document head and returns a Promise
     * that resolves when the script finishes loading.
     * If the script is already loaded or exists in the DOM, resolves immediately.
     *
     * @returns A Promise that resolves when the script is loaded.
     * @throws If the script fails to load.
     */
    load(): Promise<void>;
    /**
     * Checks if a script with the given URL already exists in the document.
     * @param url - The src of the script to check
     */
    static exists(url: string): boolean;
}
export default Script;
