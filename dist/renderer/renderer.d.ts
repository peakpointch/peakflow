import type { DashToCamelCase } from "../typeutils/index.js";
import type { IANATimeZone } from "../timezones/index.js";
import type { PartialDeep } from "type-fest";
/**
 * Tells the `Renderer` how to handle the visibility of an element
 * or field in case all its children are empty.
 */
type VisibilityControl = boolean | "emptyState";
/**
 * Defines the type of a `FilterAttribute`.
 */
type FilterAttributeType = {
    string: string;
    number: number;
    boolean: boolean;
    date: Date;
};
export type FilterAttributes<T extends string = string> = {
    [K in T]: keyof FilterAttributeType;
};
type PropsFromFilterAttributes<F extends FilterAttributes> = {
    [K in keyof F as DashToCamelCase<K & string>]?: FilterAttributeType[F[K]];
};
/**
 * A `RenderField` ...
 */
export type RenderField<F extends FilterAttributes<keyof F & string> = {}> = {
    /**
     * The name or identifier of this `RenderField` type.
     * Typically corresponds to the kind of content it represents, e.g., "title" or "description".
     */
    element: string;
    /**
     * An optional instance identifier for distinguishing between multiple fields
     * of the same `element` type within a parent. Useful for indexing or targeting
     * specific fields in a set.
     */
    instance?: string;
    /**
     * The value of this field as a string.
     * The format or interpretation of this value depends on the `type` property.
     */
    value: string;
    /**
     * The type of this field.
     *
     * This tells the Renderer how to render the `value`
     */
    type?: "text" | "html" | "date";
    /**
     * Whether this `RenderField` should be visible when it's rendered.
     */
    visibility: boolean;
    /**
     * Marks this field as decorative.
     *
     * Decorative fields are ignored when determining whether their parent element
     * should be hidden. In other words, even if a decorative field has a value,
     * it does not prevent the parent element from being considered empty.
     */
    decorative?: boolean;
    /**
     * Additional properties for this field.
     *
     * Can be used to filter, sort, or otherwise categorize fields based on custom
     * metadata.
     */
    props?: PropsFromFilterAttributes<F>;
};
/**
 * A `RenderElement` can wrap multiple `RenderField`'s or even `RenderElement`'s.
 * It is helpful when grouping data together in an object oriented way.
 */
export type RenderElement<F extends FilterAttributes<keyof F & string> = {}> = {
    /**
     * The name or identifier of this `RenderElement` type.
     * Typically corresponds to the kind of content its fields make up, for
     * example "dish" or "day".
     */
    element: string;
    /**
     * An optional instance identifier for distinguishing between multiple elements
     * of the same `element` type within a parent. Useful for indexing or targeting
     * specific fields in a set.
     */
    instance?: string;
    /**
     * The children as `RenderData` this `RenderElement` groups together
     */
    fields: RenderData<F>;
    /**
     * Whether this `RenderElement` should be visible when it's rendered.
     */
    visibility: boolean;
    /**
     * Marks this `RenderElement` as decorative.
     *
     * Decorative `RenderElement`s are ignored when determining whether their
     * parent element should be hidden. In other words, even if a decorative field
     * has a value, it does not prevent the parent element from being considered
     * empty.
     */
    decorative?: boolean;
    /**
     * Additional properties for this element.
     *
     * Can be used to filter, sort, or otherwise categorize elements based on
     * custom metadata.
     */
    props?: PropsFromFilterAttributes<F>;
};
export type RenderData<F extends FilterAttributes = {}> = Array<RenderField<F> | RenderElement<F>>;
export interface RendererOptions<F extends FilterAttributes<keyof F & string> = {}> {
    /**
     * The base attribute used to identify render elements in the DOM.
     *
     * @example
     * "render" will look for elements like:
     *   <div data-render-element="example" />.
     */
    attributeName: string;
    /**
     * Defines which HTML attributes should be read as typed values on `props`
     * of `RenderField` and `RenderElement`. Keys must be in dash-case and will
     * be converted to camelCase. Values indicate the expected type.
     * –
     * @example
     * { "start-date": "date" } maps to props: { startDate: Date }
     * For: <div data-render-element="event" start-date="2024-01-01" />
     */
    filterAttributes: F;
    /**
     * The IANA timezone name used when parsing dates from the DOM.
     *
     * This is important if the DOM values are in a fixed timezone
     * (e.g., "Europe/Zurich") while your JavaScript runtime may use another.
     *
     * Set to `false` to disable timezone handling and treat dates as-is.
     *
     * @example
     * timezone: "Europe/Zurich"
     */
    timezone?: false | IANATimeZone;
    /**
     * Fallback options for `RenderElement`'s and `RenderItem`'s when no
     * options are set on the HTML target.
     */
    defaults: {
        visibilityControl: VisibilityControl;
        /** Whether to clear the value of a `RenderField`. */
        clear: boolean;
    };
}
export declare class Renderer<F extends FilterAttributes<keyof F & string> = {}> {
    static readonly defaultOptions: RendererOptions;
    options: RendererOptions<F>;
    private canvas;
    private data;
    private lp;
    private attributeName;
    private attr;
    constructor(canvas: HTMLElement | null, options?: PartialDeep<RendererOptions<F>>);
    static defineAttributes<T extends FilterAttributes>(obj: T): T;
    render(data: RenderData<F>, canvas?: HTMLElement): void;
    private _render;
    /**
     * Render a `RenderElement` to all its instances
     */
    private renderElement;
    private renderCollection;
    /**
     * Render a `RenderElement` to a single `HTMLRenderElement`
     */
    private renderElementToTemplate;
    /**
     * Render a `RenderField` to all its instances
     */
    private renderField;
    /**
     * Render a `RenderField` to a single `HTMLRenderField`
     */
    private renderFieldToTemplate;
    /**
     * Render the value of a `renderField` into its corresponding `htmlTemplate`,
     * based on the type of its value defined through the `type` property defined
     * on the `renderField`.
     */
    private renderFieldValue;
    /**
     * Recursively reads the DOM node and its descendants to build a structured RenderData.
     * It identifies elements with `data-${elementAttr}-element` and `data-${fieldAttr}-field` attributes,
     * and processes them into RenderElement and RenderField objects.
     *
     * @param node The root node to start reading from.
     * @returns `RenderData` An array of RenderElement and RenderField objects representing the node structure.
     */
    read(node: HTMLElement, stopRecursionMatches?: string[]): RenderData<F>;
    /**
     * Clears the canvas from previous renders and reset's all element's visibility
     * to its initial state.
     */
    clear(node?: HTMLElement): void;
    private readRenderElement;
    private readRenderField;
    /**
     * Modifies the `field` properties based on the filtering attributes from `child`.
     * Handles `date` and `boolean` attributes.
     */
    private readFilteringProperties;
    /**
     * Parse the visibility control attribute value of a `child` that represents
     * a render item in the DOM.
     *
     * # VisibilityControl
     * This tells the `Renderer` wether it should dynamically show or hide a
     * `child`, if the `Renderer` decides it has no critical content.
     *
     * ## Values:
     * - "emptyState": Hides the `child` and shows an empty state tagged with
     *   the `[data-*-empty-state]` attribute. The attribute value tells the
     *   `Renderer` which render item this empty state belongs to.
     *   TODO: Make it clear that it matches elements and empty states based on the `element` property on the render element or render item.
     *
     * - `true`: Hides the `child`
     * - `false`: Disables the visibility control, meaning no elements get
     *   shown or hidden
     */
    private readVisibilityControl;
    private getEmptyStateFor;
    private shouldHideElement;
    private showHTMLElement;
    private showElement;
    private hideHTMLElement;
    private hideElement;
    private hideChildrenExceptEmptyState;
    addFilterAttributes(newAttributes: FilterAttributes): void;
    removeFilterAttributes(...attributesToRemove: string[]): void;
    private elementSelector;
    private fieldSelector;
    private instanceSelector;
    private static isRenderElement;
    private static isRenderField;
}
export {};
