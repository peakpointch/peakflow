import type { Locale } from "date-fns";
type ElementsArg = Array<NodeListOf<HTMLElement> | HTMLElement | string>;
export declare function parseDateflow(element: HTMLElement): Date;
/**
 * Formats all elements marked with the `[dateflow-date]` attribute.
 *
 * The value of `[dateflow-date]` should be an ISO-like string (e.g. `"yyyy-MM-dd"`).
 * The output format is determined by the element’s `[dateflow-format]` attribute,
 * which uses the same tokens as `date-fns` (e.g. `"dd.MM.yyyy"`, `"MMMM do, yyyy"`).
 *
 * @param locale - A `date-fns` `Locale` object that controls language-specific formatting.
 * @param containers - One or more root elements within which `[dateflow-date]` elements
 *                     will be searched and formatted. Defaults to the whole document
 *                     if no containers are provided.
 *
 * @example
 * ```html
 * <div dateflow-date="2025-08-23" dateflow-format="dd.MM.yyyy"></div>
 * ```
 */
export declare function dateflow(locale: Locale, ...containers: ElementsArg): void;
export {};
