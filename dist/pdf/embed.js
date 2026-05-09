var _a;
import { Selector } from "../selector/index.js";
import { BaseComponent } from "../base-component/index.js";
import { logPrefix } from "../utils/logger.js";
import Script from "../utils/script.js";
export class PdfEmbed extends BaseComponent {
    constructor(component, settings) {
        super(component, settings);
        this.attr = _a.attr;
        this.pdfEmbedId = "pdf-embed";
        this.lp = logPrefix("PdfEmbed", this.settings.id);
        this.elements = {
            component: this.component,
            preview: this.select("preview"),
            download: this.select("download"),
            error: this.select("error"),
            fileConfig: this.select("file-config"),
            loading: this.select("loading"),
        };
        if (!this.elements.preview) {
            throw new Error(`${this.lp}Please ensure the following elements exist: ${this.selector("preview")}`);
        }
        this.elements.preview.id = this.pdfEmbedId;
        if (typeof this.settings.clientIds === "object") {
            this.settings.clientId = _a.getClientIdByUrl(this.settings.clientIds);
            delete this.settings.clientIds;
        }
    }
    static getClientIdByUrl(config, fallback) {
        const href = window.location.href;
        for (const url in config) {
            if (href.includes(url)) {
                return config[url];
            }
            else {
                continue;
            }
        }
        if (!fallback)
            throw new Error(`Couldn't find matching clientId`);
        return fallback;
    }
    hide(element) {
        try {
            this.elements[element].style.display = "none";
        }
        catch { }
    }
    show(element) {
        if (element === "error" || element === "preview")
            this.hide("loading");
        try {
            this.elements[element].style.removeProperty("display");
            this.elements[element].classList.remove("hide");
        }
        catch { }
    }
    async preview(file) {
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
        }
        else if (file.isExternal) {
            this.show("error");
            window.location.href = file.externalUrl;
        }
        else {
            this.show("error");
            if (!this.elements.download)
                return;
            this.elements.download.click();
        }
    }
    async previewAcrobat(file) {
        const script = new Script({
            src: "https://acrobatservices.adobe.com/view-sdk/viewer.js",
        });
        script.load();
        return new Promise((resolve) => {
            const loadPdf = async () => {
                this.show("preview");
                var adobeDCView = new window.AdobeDC.View({
                    clientId: this.settings.clientId,
                    divId: this.pdfEmbedId,
                });
                await adobeDCView.previewFile({
                    content: { location: { url: file.url } },
                    metaData: { fileName: file.name },
                }, {});
                adobeDCView.registerCallback(window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER, (event) => {
                    if (event.type === "APP_RENDERING_DONE" && event.data.status === "ERROR") {
                        this.show("error");
                        this.hide("preview");
                    }
                }, { enablePDFAnalytics: true });
                return resolve();
            };
            if (window.AdobeDC) {
                loadPdf();
            }
            else {
                document.addEventListener("adobe_dc_view_sdk.ready", loadPdf);
            }
        });
    }
}
_a = PdfEmbed;
PdfEmbed.attr = {
    id: "data-pdf-id",
    element: "data-pdf-element",
};
PdfEmbed.lp = logPrefix("PdfEmbed");
PdfEmbed.attributeSelector = Selector.attr(_a.attr.element);
PdfEmbed.selector = Selector.instance(_a.attributeSelector, _a.attr);
PdfEmbed.select = Selector.select(_a.selector);
PdfEmbed.selectAll = Selector.selectAll(_a.selector);
