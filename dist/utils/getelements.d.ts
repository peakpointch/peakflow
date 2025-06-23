/**
 * Finds one or multiple elements based on input type.
 * @param input - CSS selector or HTMLElement(s).
 * @param single - Whether to fetch multiple elements. Defaults to false.
 * @returns An array of HTMLElements (or throws an error if not found).
 */
export declare function getAllElements<T extends HTMLElement = HTMLElement>(input: string | T | T[] | NodeListOf<T>, single?: boolean): T[];
export declare function getElement<T extends HTMLElement = HTMLElement>(input: string | T, singleOnly?: boolean): T;
