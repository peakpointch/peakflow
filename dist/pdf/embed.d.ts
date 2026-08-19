import type { PartialOptions } from "../typeutils/index.js";
import { type AttributeAccessorMap, type BaseAttributes } from "../selector/index.js";
import { BaseComponent, type BaseSettings } from "../base-component/index.js";
import type { DashToCamelCase } from "../typeutils/index.js";
type FileType = "(PDF)" | "(DOCX)" | "(JPEG)" | "(PNG)";
type PdfEmbedElement = "component" | "preview" | "download" | "error" | "file-config" | "loading";
export interface PdfEmbedFile {
    type: FileType | string;
    name: string;
    url: string;
    externalUrl: string;
    isExternal: boolean;
}
interface PdfEmbedAttributes extends BaseAttributes {
}
export interface PdfEmbedSettings extends BaseSettings {
    clientId: string;
}
export interface ClientIds extends BaseSettings {
    clientIds: Record<string, string>;
}
export declare class PdfEmbed extends BaseComponent<PdfEmbedElement, PdfEmbedSettings> {
    static attr: AttributeAccessorMap<PdfEmbedAttributes>;
    attr: AttributeAccessorMap<PdfEmbedAttributes>;
    elements: Record<DashToCamelCase<PdfEmbedElement>, HTMLElement | null>;
    pdfEmbedId: string;
    private static lp;
    private lp;
    constructor(component: HTMLElement, settings?: PartialOptions<PdfEmbedSettings | ClientIds>);
    protected static readonly attributeSelector: import("../index.js").AttributeSelector<PdfEmbedElement>;
    static readonly selector: import("../index.js").InstanceSelector<PdfEmbedElement>;
    static readonly select: <U extends Element = HTMLElement>(this: unknown, element: PdfEmbedElement, instance?: string, options?: import("../index.js").SelectOptions) => U;
    static readonly selectAll: <U extends Element = HTMLElement>(this: unknown, element: PdfEmbedElement, instance?: string, options?: import("../index.js").SelectOptions) => NodeListOf<U>;
    static getClientIdByUrl(config: Record<string, string>, fallback?: string): string;
    hide(element: DashToCamelCase<PdfEmbedElement>): void;
    show(element: DashToCamelCase<PdfEmbedElement>): void;
    preview(file: PdfEmbedFile): Promise<void>;
    private previewAcrobat;
}
export {};
