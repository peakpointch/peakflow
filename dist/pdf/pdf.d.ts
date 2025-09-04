import Renderer from "../renderer/index.js";
import type { RenderData } from "../renderer/index.js";
export type PdfElement = "container" | "scale" | "page" | "page-wrapper" | "weekday" | "dish";
export type PdfFieldName = string | "dishName" | "dishDescription" | "price" | "priceSmall";
export type PdfFormat = "a3" | "a4" | "a5";
export declare class Pdf {
    canvas: HTMLElement;
    renderer: Renderer;
    defaultScale: number;
    customScale: number;
    private freezeSelector;
    private scaleElement;
    private pages;
    constructor(container: HTMLElement | null);
    /**
     * Use this method to select the elements for a new `Pdf` instance.
     * @returns CSS selector string
     */
    static select: import("../attributeselector/attributeselector.js").AttributeSelector<PdfElement>;
    private getScaleElement;
    getDefaultScale(): number;
    getPages(container?: HTMLElement): HTMLElement[];
    getPageWrappers(container?: HTMLElement): HTMLElement[];
    /**
     * Retrieves an array of `HTMLElement` objects representing design wrappers or design pages.
     *
     * - If no design IDs are provided, it returns **all** available designs.
     * - If one or more design IDs are provided, it returns only the designs whose `data-pdf-design` attribute matches the specified IDs.
     *
     * @param designs - Optional list of design IDs to filter by. If empty, all designs are returned.
     * @returns Array of matching `HTMLElement` elements.
     */
    getDesignWrappers(...designs: string[]): HTMLElement[];
    getDesign(designChild: HTMLElement): string;
    /**
     * Render any data of type `RenderData` on the pdf canvas.
     *
     * @param data Data of type `RenderData`. This data will be given to the Renderer instance to render it.
     */
    render(data: RenderData, design?: string): void;
    /**
     * Scales the PDF to the given value.
     *
     * @param scale Scale value in `em`, e.g. `0.3` will scale the canvas to `0.3em`.
     */
    scale(scale: number, store?: boolean): void;
    resetScale(): void;
    resetDefaultScale(): void;
    freeze(): void;
    unFreeze(): void;
    /**
     * @param page The current page element as an `HTMLElement`.
     * @param scale The scale of the canvas.
     * @returns The prepared `HTMLCanvasElement`.
     */
    private prepareCanvas;
    private isPageHidden;
    hyphenizePages(...pages: HTMLElement[]): void;
    private create;
    save(format: PdfFormat, filename?: string, clientScale?: number): Promise<void>;
}
