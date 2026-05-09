import type { Attributes, Attribute } from "./attributes";
type AttributeMatchType = "startsWith" | "endsWith" | "includes" | "whitespace" | "hyphen" | "exact";
export type AttributeSelector<T = string> = (name?: T, options?: Partial<AttributeOptions>) => string;
export type InstanceSelector<T = string> = (element: T, instance?: string) => string;
export interface BaseAttributes extends Attributes {
    id: Attribute;
    element: Attribute;
}
export interface AttributeDefaultOptions<T extends string> {
    defaultMatchType: AttributeMatchType;
    defaultValue: T | undefined;
    defaultExclusions: string[];
}
export interface AttributeOptions {
    matchType: AttributeMatchType;
    exclusions: string[];
}
export interface InstanceDefaultOptions<T extends string> {
    /**
     * Defines which element string represents the component's root.
     * @default "component"
     */
    root?: T;
    /**
     * If true, elements are searched for inside the instance container.
     * If false, all elements must have an instance ID.
     * @default true
     */
    scoped?: boolean;
}
export interface SelectOptions {
    doc: Document | Element;
}
/**
 * Excludes a CSS selector from a CSS selector.
 *
 * @param selector The original selector that should exclude specific elements.
 * @param exclusions The selectors to exclude from the original selector.
 * @returns A CSS selector.
 */
export declare function exclude(selector: string, ...exclusions: string[]): string;
export declare function extend(selector: string, ...extensions: string[]): string;
export declare function append(selectorList: string[], suffix: string): string;
export declare function split(selector: string): string[];
export declare class Selector {
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
    static attr<T extends string = string>(attrName: string, defaultOptions?: Partial<AttributeDefaultOptions<T>>): AttributeSelector<T>;
    /**
     * Creates an instance specific selector function for a `BaseComponent` class.
     *
     * @template T - The union of all allowed element names for a component.
     * @param attributeSelector - The attributeSelector member of the component class.
     * @param attr - The attr member of component class.
     * @returns A typed static member that generates an instance specific selector string.
     */
    static instance<T extends string>(attributeSelector: AttributeSelector<T>, attr: BaseAttributes, options?: InstanceDefaultOptions<T>): InstanceSelector<T>;
    static select<T extends string>(instanceSelector: InstanceSelector<T>): <U extends Element = HTMLElement>(element: T, instance?: string, options?: SelectOptions) => U;
    static selectAll<T extends string>(instanceSelector: InstanceSelector<T>): <U extends Element = HTMLElement>(element: T, instance?: string, options?: SelectOptions) => NodeListOf<U>;
}
export {};
