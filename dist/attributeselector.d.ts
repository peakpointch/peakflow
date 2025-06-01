type AttributeMatchType = 'startsWith' | 'endsWith' | 'includes' | 'whitespace' | 'hyphen' | 'exact';
type AttributeSelector<T = string> = (name?: T, options?: Partial<AttributeOptions>) => string;
interface AttributeDefaultOptions<T extends string> {
    defaultMatchType: AttributeMatchType;
    defaultValue: T | undefined;
    defaultExclusions: string[];
}
interface AttributeOptions {
    matchType: AttributeMatchType;
    exclusions: string[];
}
/**
 * Excludes a CSS selector from a CSS selector.
 *
 * @param selector The original selector that should exclude specific elements.
 * @param exclusions The selectors to exclude from the original selector.
 * @returns A CSS selector.
 */
declare function exclude(selector: string, ...exclusions: string[]): string;
/**
 * Creates a selector function based on the provided attribute name.
 * The returned selector function can be used to generate a string selector for the given name.
 * If no name is provided, it will return a selector with just the attribute name.
 *
 * @template T - The type of the name that will be passed to the generated selector function (e.g., string).
 * @param attrName - The name of the attribute that will be used in the selector.
 * @param defaultOptions - Options to configure selector generation.
 * @returns A function that generates the selector string based on the provided name and match type.
 */
declare const createAttribute: <T extends string = string>(attrName: string, defaultOptions?: Partial<AttributeDefaultOptions<T>>) => AttributeSelector<T>;
export default createAttribute;
export { exclude };
export type { AttributeSelector, AttributeDefaultOptions, AttributeOptions };
