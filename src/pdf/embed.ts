import type { PartialDeep } from "type-fest";
import { Selector, type AttributeAccessorMap, type BaseAttributes } from "../selector/index.js";
import { BaseComponent, type BaseSettings } from "../base-component/index.js";
import { logPrefix } from "../utils/logger.js";
import type { DashToCamelCase } from "../typeutils/index.js";
import Script from "../utils/script.js";

type FileType = "(PDF)" | "(DOCX)" | "(JPEG)" | "(PNG)";
type PdfEmbedElement = "component" | "preview" | "download" | "error" | "file-config" | "loading";

export interface PdfEmbedFile {
  type: FileType | string;
  name: string;
  url: string;
  externalUrl: string;
  isExternal: boolean;
}

interface PdfEmbedAttributes extends BaseAttributes {}

export interface PdfEmbedSettings extends BaseSettings {
  clientId: string;
}

export interface ClientIds extends BaseSettings {
  clientIds: Record<string, string>;
}

export class PdfEmbed extends BaseComponent<PdfEmbedElement, PdfEmbedSettings> {
  public static attr: AttributeAccessorMap<PdfEmbedAttributes> = {
    id: "data-pdf-id",
    element: "data-pdf-element",
  };

  public attr: AttributeAccessorMap<PdfEmbedAttributes> = PdfEmbed.attr;
  public elements: Record<DashToCamelCase<PdfEmbedElement>, HTMLElement | null>;
  public pdfEmbedId: string = "pdf-embed";
  private static lp = logPrefix("PdfEmbed");
  private lp = logPrefix("PdfEmbed", this.settings.id);

  constructor(component: HTMLElement, settings?: PartialDeep<PdfEmbedSettings | ClientIds>) {
    super(component, settings);
    this.elements = {
      component: this.component,
      preview: this.select("preview"),
      download: this.select("download"),
      error: this.select("error"),
      fileConfig: this.select("file-config"),
      loading: this.select("loading"),
    };

    if (!this.elements.preview) {
      throw new Error(
        `${this.lp}Please ensure the following elements exist: ${this.selector("preview")}`,
      );
    }
    this.elements.preview.id = this.pdfEmbedId;

    if (typeof (this.settings as any).clientIds === "object") {
      this.settings.clientId = PdfEmbed.getClientIdByUrl((this.settings as any).clientIds);
      delete (this.settings as any).clientIds;
    }
  }

  protected static attributeSelector = Selector.attr<PdfEmbedElement>(PdfEmbed.attr.element);
  public static selector = Selector.instance<PdfEmbedElement>(this.attributeSelector, this.attr);
  public static select = Selector.select<PdfEmbedElement>(this.selector);
  public static selectAll = Selector.selectAll<PdfEmbedElement>(this.selector);

  public static getClientIdByUrl(config: Record<string, string>, fallback?: string): string {
    const href = window.location.href;

    for (const url in config) {
      if (href.includes(url)) {
        return config[url];
      } else {
        continue;
      }
    }

    if (!fallback) throw new Error(`Couldn't find matching clientId`);
    return fallback;
  }

  public hide(element: DashToCamelCase<PdfEmbedElement>) {
    try {
      this.elements[element].style.display = "none";
    } catch {}
  }

  public show(element: DashToCamelCase<PdfEmbedElement>) {
    if (element === "error" || element === "preview") this.hide("loading");
    try {
      this.elements[element].style.removeProperty("display");
      this.elements[element].classList.remove("hide");
    } catch {}
  }

  public async preview(file: PdfEmbedFile): Promise<void> {
    this.show("loading");
    this.hide("error");

    if (!file) {
      throw new Error(`${this.lp}File config is empty. Please provide a file config.`);
    }

    if (file.type === "(PDF)" && !file.isExternal) {
      if (!file.url) {
        this.show("error");
        throw new Error(`${this.lp}Invalid file url "${file.url}"`);
      }

      await this.previewAcrobat(file);
    } else if (file.isExternal) {
      this.show("error");
      window.location.href = file.externalUrl;
    } else {
      this.show("error");
      if (!this.elements.download) return;
      this.elements.download.click();
    }
  }

  private async previewAcrobat(file: PdfEmbedFile): Promise<void> {
    const script = new Script({
      src: "https://acrobatservices.adobe.com/view-sdk/viewer.js",
    });
    script.load();

    return new Promise<void>((resolve) => {
      const loadPdf = async () => {
        this.show("preview");

        var adobeDCView = new window.AdobeDC.View({
          clientId: this.settings.clientId,
          divId: this.pdfEmbedId,
        });

        await adobeDCView.previewFile(
          {
            content: { location: { url: file.url } },
            metaData: { fileName: file.name },
          },
          {},
        );

        adobeDCView.registerCallback(
          window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
          (event) => {
            if (event.type === "APP_RENDERING_DONE" && event.data.status === "ERROR") {
              this.show("error");
              this.hide("preview");
            }
          },
          { enablePDFAnalytics: true },
        );

        return resolve();
      };

      if (window.AdobeDC) {
        loadPdf();
      } else {
        document.addEventListener("adobe_dc_view_sdk.ready", loadPdf);
      }
    });
  }
}
