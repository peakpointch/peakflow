import { DashToCamelCase } from "./typeutils";
type FilterAttributeType = {
    "string": string;
    "number": number;
    "boolean": boolean;
    "date": Date;
};
type FilterAttributes<T extends string = string> = {
    [K in T]: keyof FilterAttributeType;
};
type PropsFromFilterAttributes<F extends FilterAttributes> = {
    [K in keyof F as DashToCamelCase<K & string>]?: FilterAttributeType[F[K]];
};
type RenderField<F extends FilterAttributes<keyof F & string> = {}> = {
    element: string;
    instance?: string;
    value: string;
    type?: 'text' | 'html' | 'date';
    visibility: boolean;
    props?: PropsFromFilterAttributes<F>;
};
type RenderElement<F extends FilterAttributes<keyof F & string> = {}> = {
    element: string;
    instance?: string;
    fields: RenderData<F>;
    visibility: boolean;
    props?: PropsFromFilterAttributes<F>;
};
type RenderData<F extends FilterAttributes = {}> = Array<RenderField<F> | RenderElement<F>>;
interface RendererOptions<F extends FilterAttributes<keyof F & string> = {}> {
    attributeName: string;
    filterAttributes: F;
    timezone?: false | string;
}
declare class Renderer<F extends FilterAttributes<keyof F & string> = {}> {
    options: RendererOptions<F>;
    private canvas;
    private data;
    private fieldAttr;
    private elementAttr;
    private emptyStateAttr;
    private collectionAttr;
    private attributeName;
    constructor(canvas: HTMLElement | null, options?: Partial<RendererOptions<F>>);
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
     * Recursively reads the DOM node and its descendants to build a structured RenderData.
     * It identifies elements with `data-${elementAttr}-element` and `data-${fieldAttr}-field` attributes,
     * and processes them into RenderElement and RenderField objects.
     *
     * @param node The root node to start reading from.
     * @returns `RenderData` An array of RenderElement and RenderField objects representing the node structure.
     */
    read(node: HTMLElement, stopRecursionMatches?: string[]): RenderData<F>;
    clear(node?: HTMLElement): void;
    private readRenderElement;
    private readRenderField;
    /**
     * Modifies the `field` properties based on the filtering attributes from `child`.
     * Handles `date` and `boolean` attributes.
     */
    private readFilteringProperties;
    /**
     * Parse the visibility control attribute value of a Render-`child`.
     *
     * ### "VisibilityControl" tells the `Renderer` wether it should mess with a `RenderElement`'s or `RenderField`'s visibility
     * - `emptyState`: Shows an empty state if the children are hidden
     * - `true`: Hides the element if there is no content to be shown.
     * - `false`: Disable visibility control, do not mess with the element's visibility.
     */
    private readVisibilityControl;
    private shouldHideElement;
    private showHTMLElement;
    private showElement;
    private hideElement;
    addFilterAttributes(newAttributes: FilterAttributes): void;
    removeFilterAttributes(...attributesToRemove: string[]): void;
    private elementSelector;
    private fieldSelector;
    private instanceSelector;
    private static isRenderElement;
    private static isRenderField;
}
export default Renderer;
export type { RenderData, RenderElement, RenderField, FilterAttributes };
