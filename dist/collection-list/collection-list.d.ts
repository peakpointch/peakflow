import { type Attribute, type Attributes, Dataset } from "../selector/attributes.js";
import type { CollectionListItem } from "./item.js";
import type { PartialDeep } from "type-fest";
import { BaseComponent } from "../base-component/index.js";
import { type PayloadVariables } from "../payload/payload.js";
type CollectionListElement = "wrapper" | "list" | "item" | "empty" | "pagination";
interface CollectionListAttributes extends Attributes {
    id: Attribute;
    element: Attribute<string, CollectionListElement>;
    key: Attribute;
}
interface CollectionListSettings {
    id: string;
    hasNestedList: boolean;
    /**
     * Choose how you want to select the component elements
     * - "peakflow": selects the elements using the component attributes (recommended)
     * - "webflow": selects the elements using the builtin webflow classes
     *
     * NOTE: In "webflow" mode, the json embed still needs to be tagged using `[data-cms-element="json"]`
     */
    selectorMode: "peakflow" | "webflow";
}
export declare class CollectionList<Item extends CollectionListItem = CollectionListItem> extends BaseComponent<CollectionListElement> {
    static defaultOptions: CollectionListSettings;
    static dataset: Dataset<CollectionListAttributes>;
    static attr: import("../index.js").AttributeAccessorMap<CollectionListAttributes>;
    dataset: Dataset<CollectionListAttributes>;
    attr: import("../index.js").AttributeAccessorMap<CollectionListAttributes>;
    data: Item[];
    settings: CollectionListSettings;
    listElement?: HTMLElement | null;
    emptyState?: HTMLElement | null;
    private items;
    constructor(component: HTMLElement | null, settings?: PartialDeep<CollectionListSettings>);
    private initElements;
    protected static attributeSelector: import("../index.js").AttributeSelector<CollectionListElement>;
    static selector: import("../index.js").InstanceSelector<CollectionListElement>;
    static select: <U extends Element = HTMLElement>(element: CollectionListElement, instance?: string, options?: import("../index.js").SelectOptions) => U;
    static selectAll: <U extends Element = HTMLElement>(element: CollectionListElement, instance?: string, options?: import("../index.js").SelectOptions) => NodeListOf<U>;
    /**
     * @returns True if the collection list has no items, false otherwise.
     */
    isEmpty(): boolean;
    /**
     * Parses the JSON Data Island of each list item and stores them in `collection.data`.
     *
     * @example HTML structure
     * ```html
     * <div data-cms-element="wrapper" data-cms-id="dokumente">
     *   <div data-cms-element="list">
     *     <div data-cms-element="item" key="{{slug}}">
     *       <script type="application/json" data-cms-element="json" data-cms-id="dokumente">
     *         { // JSON of your choice }
     *       </script>
     *     </div>
     *   </div>
     * </div>
     * ```
     */
    parse(options?: Partial<ParseOptions>): Item[];
    /**
     * Only show items that meet the condition specified in the `predicate` function.
     * @returns The filtered array.
     * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
     * @param options Additional options that define how the filtering is conducted.
     */
    filter(predicate: FilterFn<Item>, options?: Partial<FilterOptions>): Item[];
    /**
     * Sorts the `data` array property of this collection list in place, then renders the new order into the `listElement`.
     *
     * @param compareFn Function used to determine the order of the elements. It is expected to return
     * a negative value if the first argument is less than the second argument, zero if they're equal, and a positive
     * value otherwise. If omitted, the elements are sorted in ascending, UTF-16 code unit order.
     *
     * @example Sort by `item.price` in descending order
     * ```ts
     * collection.sort((a, b) => a.price - b.price)
     * ```
     */
    sort(compareFn: CompareFn<Item>): Item[];
}
export type FilterFn<T extends CollectionListItem> = (item: T, index: number) => boolean;
export type CompareFn<T extends CollectionListItem> = (a: T, b: T) => number;
export interface ParseOptions {
    /**
     * Custom variables to be used during the hydration process.
     *
     * @remarks
     * These values take precedence over variables parsed directly from the DOM
     * (i.e. `[data-payload-var]` elements). Use this to programmatically
     * override CMS data or inject global values.
     */
    variables: PayloadVariables;
}
export interface FilterOptions {
    /**
     * Determines whether elements that do not match the filter criteria
     * should be physically removed from the DOM.
     *
     * @defaultValue `false`
     */
    removeFromDom: boolean;
}
export {};
