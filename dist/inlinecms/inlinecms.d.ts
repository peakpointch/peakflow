import { type ElementGetter } from "../utils/getelements.js";
interface InlineCmsSingleOptions {
    /**
     * CSS selector or HTMLElement(s) for the origin(s).
     */
    origin: ElementGetter<HTMLElement>;
    /**
     * CSS selector or HTMLElement for the target. If omitted, parent of the origin is used.
     */
    target?: ElementGetter<HTMLElement>;
    /** The document to perform the operations on. For advanced users only. */
    doc?: Document | Element;
}
/**
 * Single origin version of inlineCms. For advanced users only.
 * @param options - Specify the origin, target and the doc to perform the operation on.
 */
export declare function inlineCmsSingle(options: InlineCmsSingleOptions): void;
interface InlineCmsOptions {
    /**
     * CSS selector or HTMLElement(s) for the origin(s). Default: "[data-inlinecms-origin]"
     * Each origin must have a `data-inlinecms-target` attribute.
     */
    origins?: ElementGetter<HTMLElement>;
    /** The document to perform the operations on. For advanced users only. */
    doc?: Document | Element;
}
/**
 * Processes CMS wrappers (origins), extracting their items into their respective target.
 * @param options - Specify the  and the doc to perform the operation on.
 */
export declare function inlineCms(options: InlineCmsOptions): void;
export {};
