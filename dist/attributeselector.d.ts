type AttributeMatchType = 'startsWith' | 'endsWith' | 'includes' | 'whitespace' | 'hyphen' | 'exact';
type AttributeSelector<T = string> = (name?: T, type?: AttributeMatchType) => string;
interface AttributeOptions<T extends string> {
    defaultType: AttributeMatchType;
    defaultValue: T | undefined;
    exclusions: string[];
}
/**
 * Creates a selector function based on the provided attribute name.
 * The returned selector function can be used to generate a string selector for the given name.
 * If no name is provided, it will return a selector with just the attribute name.
 *
 * @template T - The type of the name that will be passed to the generated selector function (e.g., string).
 * @param attrName - The name of the attribute that will be used in the selector.
 * @param options - Options to configure selector generation.
 * @returns A function that generates the selector string based on the provided name and match type.
 */
declare const createAttribute: <T extends string = string>(attrName: string, options?: AttributeOptions<T>) => AttributeSelector<T>;
export default createAttribute;
export type { AttributeSelector, AttributeOptions };
