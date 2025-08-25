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
    element: HTMLScriptElement;
    /** Tracks whether the script has finished loading */
    private loaded;
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
     * Adds or updates an attribute on the script element.
     *
     * @param name - The attribute name.
     * @param value - The attribute value.
     */
    setAttribute(name: string, value: string): void;
    /**
     * Appends the script to the document head and returns a Promise
     * that resolves when the script finishes loading.
     * If the script is already loaded, resolves immediately.
     *
     * @returns A Promise that resolves when the script is loaded.
     * @throws If the script fails to load.
     */
    load(): Promise<void>;
}
