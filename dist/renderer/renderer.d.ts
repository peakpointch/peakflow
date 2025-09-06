import type { PartialDeep } from "type-fest";
import Path from "../path/index.js";
import { HTMLRenderNode, HTMLRenderField, HTMLRenderBlock } from "./dom/index.js";
import type { RenderData, RendererOptions, RendererWarnings, RenderAttributes, FilterAttributes } from "./types.js";
export declare class Renderer<F extends FilterAttributes<keyof F & string> = {}> {
    static readonly defaultOptions: RendererOptions;
    options: RendererOptions<F>;
    /**
     * The path keeps track of where the renderer is currently rendering.
     *
     * @example "weekday.Tuesday.dish"
     */
    readonly path: Path;
    attr: RenderAttributes;
    data: RenderData<F>;
    private canvas;
    private currentData;
    private lp;
    private attributeName;
    private warnings;
    constructor(canvas: HTMLElement | null, options?: PartialDeep<RendererOptions<F>>);
    static defineAttributes<T extends FilterAttributes>(obj: T): T;
    static getAttributes(attributeName?: string): RenderAttributes;
    logWarnings(...keys: (keyof RendererWarnings)[]): Partial<RendererWarnings>;
    clearWarnings(...keys: (keyof RendererWarnings)[]): void;
    render(data: RenderData<F>, canvas?: HTMLElement): void;
    private _render;
    private assertNoSpaces;
    /**
     * Render a `RenderBlock` to all its instances
     */
    private renderBlock;
    private renderCollection;
    /**
     * Render a `RenderBlock` to a single `HTMLRenderNode`
     */
    private renderBlockToTemplate;
    /**
     * Returns the subset of children of a RenderBlock that correspond
     * to elements inside the given container element.
     */
    private getChildrenForContainer;
    /**
     * Render a `RenderField` to all its instances
     */
    private renderField;
    /**
     * Render a `RenderField` to a single `HTMLRenderField`
     */
    private renderFieldToTemplate;
    /**
     * Render the value of a `renderField` into its corresponding `htmlNode`,
     * based on the type of its value defined through the `type` property defined
     * on the `renderField`.
     */
    private renderFieldValue;
    private renderImage;
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
    private readInheritedVisibility;
    private readVisibility;
    private getEmptyStateFor;
    private shouldHideField;
    private shouldHideBlock;
    private showHTMLElement;
    private hideHTMLElement;
    private showNode;
    private hideNode;
    private showAncestor;
    private hideAncestor;
    /**
     * Finds the closest ancestor to show or hide.
     *
     * @returns A HTMLElement if the ancestor was found. The selector string that was expected
     * to find the ancestor, if no ancestor was found.
     */
    private findClosestAncestor;
    private hideChildrenExceptEmptyState;
    addFilterAttributes(newAttributes: FilterAttributes): void;
    removeFilterAttributes(...attributesToRemove: string[]): void;
    private blockSelector;
    private fieldSelector;
    private instanceSelector;
    isHTMLRenderNode(element: HTMLElement): element is HTMLRenderNode;
    isHTMLRenderBlock(element: HTMLElement): element is HTMLRenderBlock;
    isHTMLRenderField(element: HTMLElement): element is HTMLRenderField;
    private static isRenderBlock;
    private static isRenderField;
}
