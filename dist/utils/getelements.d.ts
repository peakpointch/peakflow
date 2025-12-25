type GetElementOptions = {
    single: boolean;
    node: Element | Document;
};
export type ElementGetter<T extends Element = HTMLElement> = string | T | T[] | NodeListOf<T>;
/**
 * Finds one or multiple elements based on input type.
 * @param input - CSS selector or HTMLElement(s).
 * @param single - Whether to fetch multiple elements. Defaults to false.
 * @returns An array of HTMLElements (or throws an error if not found).
 */
export declare function getAllElements<T extends HTMLElement = HTMLElement>(input: ElementGetter<T>, options?: Partial<GetElementOptions>): T[];
export declare function getElement<T extends HTMLElement = HTMLElement>(input: string | T, options?: Partial<GetElementOptions>): T;
export {};
