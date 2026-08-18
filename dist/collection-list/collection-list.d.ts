import { type Attribute, type Attributes, Dataset } from "../selector/attributes.js";
import type { CollectionListItem } from "./item.js";
import type { PartialOptions } from "../typeutils/index.js";
import { BaseComponent } from "../base-component/index.js";
import type { PayloadVariables } from "../payload/types.js";
type CollectionListElement = "wrapper" | "list" | "item" | "empty" | "pagination";
type CollectionListSelectorMode = "peakflow" | "webflow";
interface CollectionListAttributes extends Attributes {
    id: Attribute;
    element: Attribute<string, CollectionListElement>;
    key: Attribute;
}
/**
 * Defines the item parser accepted by `CollectionList`.
 *
 * `PayloadSchema` implements this contract, but consumers may provide any parser
 * with a compatible `parseData()` method.
 */
export interface CollectionListPayloadSchema<Item extends CollectionListItem> {
    parseData(value: unknown): Item;
}
export interface NestedCollectionListSettings {
    /**
     * Overrides the parent list's selector mode when its DOM uses a different
     * tagging strategy.
     */
    selectorMode?: CollectionListSelectorMode;
    /**
     * Describes collection lists nested directly inside this list.
     *
     * This configuration only describes how to find nested list wrappers. Their
     * values are validated by nested definitions in the root list's payload schema.
     */
    nestedLists?: NestedCollectionLists;
}
export type NestedCollectionLists = Record<string, NestedCollectionListSettings>;
export interface CollectionListSettings<Item extends CollectionListItem> {
    id: string;
    /**
     * Selects list elements through Peakflow's `data-cms-element` attributes or
     * Webflow's generated collection classes.
     *
     * @defaultValue `"peakflow"`
     */
    selectorMode: CollectionListSelectorMode;
    /**
     * Validates each item after its variables and nested collections are resolved.
     *
     * `parse()` requires a schema, but DOM-only operations do not. Nested lists are
     * inserted through `{{cms:...}}` references before this schema runs, so their
     * validation belongs in nested definitions within the outermost list's schema.
     */
    schema?: CollectionListPayloadSchema<Item>;
    /**
     * Describes the nested collection-list wrappers available to `{{cms:...}}`
     * references.
     *
     * Each key must match the nested wrapper's `data-cms-id`. Only configured lists
     * are discovered and materialized.
     *
     * @defaultValue `{}`
     */
    nestedLists: NestedCollectionLists;
}
/**
 * Manages parsed data and live DOM elements for a Webflow Collection List.
 *
 * - `parse()` parses structured JSON payloads into `Item`s
 * - `filter()` returns matching items and updates their live DOM elements
 * - `sort()` sorts the parsed items and their live DOM elements
 * - Uses the library's familiar static and instance selector pattern inherited
 *   from `BaseComponent`
 *
 * @example
 * ```typescript
 * import { CollectionList } from "peakflow/collection-list";
 * import { Payload } from "peakflow/payload";
 *
 * const productSchema = Payload.define(
 *   {
 *     slug: Payload.String(),
 *     name: Payload.String(),
 *     price: Payload.Number(),
 *   },
 *   { primitivesFromString: true },
 * );
 *
 * type Product = Payload.Parsed<typeof productSchema>;
 *
 * const products = new CollectionList<Product>(
 *   CollectionList.select("wrapper", "products"),
 *   {
 *     id: "products",
 *     selectorMode: "peakflow",
 *     schema: productSchema,
 *   },
 * );
 *
 * products.parse();
 * products.filter((product) => product.price > 100);
 * products.sort((a, b) => a.price - b.price);
 * ```
 *
 * @example
 * ```html
 * <div class="w-dyn-list" data-cms-element="wrapper" data-cms-id="products">
 *   <div class="w-dyn-items" data-cms-element="list">
 *     <div class="w-dyn-item" data-cms-element="item">
 *       <script
 *         type="application/json"
 *         data-payload-element="embed"
 *         data-cms-id="products"
 *       >
 *         {
 *           "slug": "desk-lamp",
 *           "name": "Desk lamp",
 *           "price": "129"
 *         }
 *       </script>
 *     </div>
 *   </div>
 * </div>
 * ```
 */
export declare class CollectionList<Item extends CollectionListItem = CollectionListItem> extends BaseComponent<CollectionListElement> {
    static defaultOptions: CollectionListSettings<CollectionListItem>;
    static dataset: Dataset<CollectionListAttributes>;
    static attr: import("../index.js").AttributeAccessorMap<CollectionListAttributes>;
    dataset: Dataset<CollectionListAttributes>;
    attr: import("../index.js").AttributeAccessorMap<CollectionListAttributes>;
    settings: CollectionListSettings<Item>;
    listElement?: HTMLElement | null;
    emptyState?: HTMLElement | null;
    /**
     * Stores parsed items in the same order as `elements` after a successful
     * `parse()`.
     *
     * Filtering leaves this array unchanged. Sorting mutates both arrays to preserve
     * their positional relationship.
     */
    items: Item[];
    /**
     * Stores live item elements in the same order as `items`.
     *
     * Filtering may hide or detach elements but never removes them from this array.
     */
    elements: HTMLElement[];
    constructor(component: HTMLElement | null, settings?: PartialOptions<CollectionListSettings<Item>>);
    private initElements;
    protected static attributeSelector: import("../index.js").AttributeSelector<CollectionListElement>;
    static selector: import("../index.js").InstanceSelector<CollectionListElement>;
    static select: <U extends Element = HTMLElement>(element: CollectionListElement, instance?: string, options?: import("../index.js").SelectOptions) => U;
    static selectAll: <U extends Element = HTMLElement>(element: CollectionListElement, instance?: string, options?: import("../index.js").SelectOptions) => NodeListOf<U>;
    isEmpty(): boolean;
    private assertSchema;
    private assertItemsMatchElements;
    /**
     * Builds and validates the data for every item in this list.
     *
     * Configured nested lists are built first without schema validation.
     * `{{cms:id}}` inserts a nested list's complete item array, while
     * `{{cms:id.path}}` inserts an array containing that property from every nested
     * item. The current list's schema then validates the fully assembled object once.
     *
     * Items that fail with `PayloadValueError` are omitted from `items` and reported
     * together after the list is processed. Other errors stop parsing immediately.
     */
    parse(options?: Partial<ParseOptions>): Item[];
    /**
     * Builds item objects for insertion into a parent collection.
     *
     * Variables are resolved, but schema validation is deferred because the
     * outermost list's schema owns the final shape, including every nested
     * collection.
     */
    private materialize;
    /**
     * Assembles one item before the outermost schema validates it.
     *
     * Nested items are assembled first so the current item's `{{cms:...}}`
     * references receive actual arrays. Hydration happens at every level so DOM,
     * custom, and nested-collection references are resolved before insertion into a
     * parent item.
     */
    private materializeItem;
    /**
     * Builds the nested collections configured for one item.
     *
     * Configuration, rather than arbitrary DOM descendants, defines which wrappers
     * become available through the `cms` resolver. This prevents deeper lists from
     * being assigned to the wrong parent level.
     */
    private materializeNestedLists;
    /**
     * Finds the payload embed owned by one collection item.
     *
     * Embeds inside nested items are excluded. Requiring exactly one direct embed
     * prevents a parent item from silently reading a child's payload or choosing
     * between ambiguous payloads.
     */
    private getItemEmbed;
    /**
     * Finds the configured nested wrapper owned by one collection item.
     *
     * Only direct nested wrappers are eligible. Missing or duplicate wrappers mean
     * the DOM no longer matches `nestedLists` and are reported as configuration
     * errors.
     */
    private getNestedWrapper;
    private assertMaterializedItem;
    /**
     * Creates the `cms` resolver for nested collection data.
     *
     * A path containing only a collection ID returns its complete item array.
     * Additional path segments return a projection: one resolved property value per
     * item, preserving collection order.
     */
    private static createCmsResolver;
    /**
     * Produces one readable report for schema failures collected across the list.
     *
     * Failures are grouped first by payload path and then by message so repeated CMS
     * data problems do not flood the console with one stack trace per item.
     */
    private reportParseErrors;
    /**
     * Shows only items accepted by the predicate without changing `items` or
     * `elements`.
     *
     * By default, rejected elements remain in the DOM with `hidden` set. With
     * `removeFromDom`, they are detached and later reinserted in collection order
     * when they match a subsequent filter.
     */
    filter(predicate: FilterFn<Item>, options?: Partial<FilterOptions>): FilteredResponse<Item>;
    /**
     * Sorts parsed items and moves their DOM elements into the same order.
     *
     * Both `items` and `elements` are mutated. Object identity links each parsed item
     * to its element, so the same item object must not appear more than once.
     */
    sort(compareFn: CompareFn<Item>): Item[];
}
export type FilterFn<T extends CollectionListItem> = (item: T, index: number) => boolean;
export type CompareFn<T extends CollectionListItem> = (a: T, b: T) => number;
export interface ParseOptions {
    /**
     * Provides programmatic strings through `{{var:name}}` references at every
     * nesting level.
     *
     * These values do not replace `{{dom:...}}` values. The `dom`, `var`, and `cms`
     * prefixes remain separate so data from one source cannot shadow another.
     */
    variables: PayloadVariables;
}
export interface FilterOptions {
    /**
     * Detaches rejected elements instead of hiding them.
     *
     * Detached elements remain tracked and can be reinserted by a later filter.
     *
     * @defaultValue `false`
     */
    removeFromDom: boolean;
}
export interface FilteredResponse<Item extends CollectionListItem> {
    items: Item[];
    visibleElements: HTMLElement[];
}
export {};
