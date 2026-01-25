import type { PartialDeep } from "type-fest";
import { type BaseAttributes } from "../selector/index.js";
import { BaseComponent, type BaseSettings } from "../base-component/index.js";
import { type DashToCamelCase } from "../typeutils/index.js";
type FileType = "(PDF)" | "(DOCX)" | "(JPEG)" | "(PNG)";
type PdfEmbedElement = "component" | "preview" | "download" | "error" | "file-config" | "loading";
export interface PdfEmbedGlobal {
    file: PdfEmbedFile;
}
interface PdfEmbedFile {
    type: FileType | string;
    name: string;
    url: string;
    externalUrl: string;
    isExternal: boolean;
}
interface PdfEmbedAttributes extends BaseAttributes {
    file: Record<keyof PdfEmbedFile, string>;
}
interface PdfEmbedSettings extends BaseSettings {
    clientId: string;
}
interface ClientIds extends BaseSettings {
    clientIds: Record<string, string>;
}
export declare class PdfEmbed extends BaseComponent<PdfEmbedElement, PdfEmbedSettings> {
    static attr: PdfEmbedAttributes;
    attr: PdfEmbedAttributes;
    elements: Record<DashToCamelCase<PdfEmbedElement>, HTMLElement | null>;
    file: PdfEmbedFile;
    pdfEmbedId: string;
    private static lp;
    private lp;
    constructor(component: HTMLElement, settings?: PartialDeep<PdfEmbedSettings | ClientIds>);
    protected static attributeSelector: import("../selector/selector.js").AttributeSelector<PdfEmbedElement>;
    static selector: import("../selector/selector.js").InstanceSelector<PdfEmbedElement>;
    static select: <U extends Element = HTMLElement>(element: PdfEmbedElement, instance?: string) => U;
    static selectAll: <U extends Element = HTMLElement>(element: PdfEmbedElement, instance?: string) => NodeListOf<U>;
    static getFileConfig(configElement: HTMLElement): PdfEmbedFile;
    static getClientIdByUrl(config: Record<string, string>, fallback?: string): string;
    hide(element: DashToCamelCase<PdfEmbedElement>): void;
    show(element: DashToCamelCase<PdfEmbedElement>): void;
    preview(): Promise<void>;
    private previewAcrobat;
}
export {};
