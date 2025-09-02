import type { DashToCamelCase } from "../typeutils/index.js";
import type { IANATimeZone } from "../timezones/index.js";
import type { PartialDeep } from "type-fest";
/**
 * Tells the `Renderer` how to handle the visibility of a rendered element
 * in case all its children are empty.
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
     * The name of this `RenderField`.
     *
     * This defines what kind of data this field represents, for example
     * `"title"`, `"price"`, or `"description"`.
     *
     * While it can be human-readable, its main purpose is to tell the `Renderer`
     * how to interpret and map this field.
     */
    name: string;
    /**
     * An optional instance identifier for differentiating between multiple
     * nodes with the same `name` within the same parent.
     *
     * While `name` defines the type of node (e.g., "dish", "title"),
     * `instance` uniquely identifies one occurrence of that type.
     *
     * This is useful when a parent contains repeated blocks or fields
     * of the same type and you need to distinguish or target them individually.
     *
     * @example
     * { name: "dish", instance: "1" }
     * { name: "dish", instance: "2" }
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
     * Marks this `RenderField` as decorative.
     *
     * Decorative fields are ignored when determining whether their parent node
     * should be hidden. In other words, even if a decorative field has a value,
     * it does not prevent the parent node from being considered empty.
     */
    decorative?: boolean;
    /**
     * Additional properties for this `RenderField`.
     *
     * Can be used to filter, sort, or otherwise categorize `RenderNode`s based on
     * custom metadata.
     */
    props?: PropsFromFilterAttributes<F>;
};
/**
 * A `RenderBlock` can wrap multiple `RenderNode`s (fields or blocks).
 * It is helpful when grouping data together in an object oriented way.
 */
export type RenderBlock<F extends FilterAttributes<keyof F & string> = {}> = {
    /**
     * The name of this `RenderBlock`.
     *
     * This property is often used as a type identifier, which specifies the type
     * of content this block holds, for example `"dish"`, `"day"`, or `"event"`.
     *
     * It is used by the `Renderer` to map the block to the corresponding DOM
     * elements and child nodes.
     */
    name: string;
    /**
     * An optional instance identifier for differentiating between multiple
     * nodes with the same `name` within the same parent.
     *
     * While `name` defines the type of node (e.g., "dish", "title"),
     * `instance` uniquely identifies one occurrence of that type.
     *
     * This is useful when a parent contains repeated blocks or fields
     * of the same type and you need to distinguish or target them individually.
     *
     * @example
     * { name: "dish", instance: "1" }
     * { name: "dish", instance: "2" }
     */
    instance?: string;
    /**
     * The children as `RenderData` this `RenderBlock` groups together
     */
    children: RenderData<F>;
    /**
     * Whether this `RenderBlock` should be visible when it's rendered.
     */
    visibility: boolean;
    /**
     * Marks this `RenderBlock` as decorative.
     *
     * Decorative blocks are ignored when determining whether their parent node
     * should be hidden. In other words, even if a decorative block's children do have
     * values, it does not prevent the parent node from being considered empty.
     */
    decorative?: boolean;
    /**
     * Additional properties for this `RenderBlock`.
     *
     * Can be used to filter, sort, or otherwise categorize `RenderNode`s based on
     * custom metadata.
     */
    props?: PropsFromFilterAttributes<F>;
};
export type RenderNode<F extends FilterAttributes = {}> = RenderField<F> | RenderBlock<F>;
export type RenderData<F extends FilterAttributes = {}> = RenderNode<F>[];
/**
 * A `RenderHTMLElement` is the DOM element where a `RenderNode` is rendered.
 *
 * These elements are marked with `data-render-*` attributes, which tell the
 * `Renderer` where in the DOM the data from a `RenderField` or `RenderBlock`
 * should be rendered.
 *
 * In other words, a `RenderHTMLElement` is the *target container* for a
 * `RenderNode`’s content.
 */
export interface RenderHTMLElement extends HTMLElement {
}
/**
 * Defines the options of a `Renderer` instance.
 */
export interface RendererOptions<F extends FilterAttributes<keyof F & string> = {}> {
    /**
     * The base attribute used to identify render nodes in the DOM.
     *
     * @example
     * "render" will look for elements like:
     *   <div data-render-element="example" />.
     */
    attributeName: string;
    /**
     * Defines which HTML attributes should be read as typed values on `props`
     * of `RenderField` and `RenderBlock`. Keys must be in dash-case and will
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
     * Fallback options for `RenderNode`s when no options are set on the
     * RenderHTMLElement.
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
     * Render a `RenderBlock` to all its instances
     */
    private renderBlock;
    private renderCollection;
    /**
     * Render a `RenderBlock` to a single `HTMLRenderBlock`
     */
    private renderBlockToTemplate;
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
     * and processes them into `RenderBlock` and `RenderField` objects.
     *
     * @param node The root node to start reading from.
     * @returns `RenderData` An array of `RenderBlock` and `RenderField` objects representing the node structure.
     */
    read(node: HTMLElement, stopRecursionMatches?: string[]): RenderData<F>;
    /**
     * Clears the canvas from previous renders and resets the visibility of all
     * elements to its initial state.
     */
    clear(node?: HTMLElement): void;
    private readRenderBlock;
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
     *   TODO: Make it clear that it matches RenderNodes and empty states based on the `name` property on the render block or render item.
     *
     * - `true`: Hides the `child`
     * - `false`: Disables the visibility control, meaning no elements get
     *   shown or hidden
     */
    private readVisibilityControl;
    private getEmptyStateFor;
    private shouldHideBlock;
    private showHTMLElement;
    private showNode;
    private hideHTMLElement;
    private hideNode;
    private hideChildrenExceptEmptyState;
    addFilterAttributes(newAttributes: FilterAttributes): void;
    removeFilterAttributes(...attributesToRemove: string[]): void;
    private blockSelector;
    private fieldSelector;
    private instanceSelector;
    private static isRenderBlock;
    private static isRenderField;
}
export {};
