import Renderer from "./renderer";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import createAttribute from "./attributeselector";
import { finalizeHyphenation, hyphenateDOM } from "./hyphenate";
const _Pdf = class _Pdf {
  constructor(container) {
    if (!container) throw new Error("PDF Element not found.");
    this.canvas = container;
    this.renderer = new Renderer(container, { attributeName: "pdf" });
    this.getPages();
    this.getScaleElement();
  }
  getScaleElement() {
    const scale = this.canvas.querySelector(_Pdf.select("scale"));
    if (!scale) {
      console.warn(`Scale element ${_Pdf.select("scale")} is undefined.`);
      return;
    }
    this.scaleElement = scale;
    return this.scaleElement;
  }
  getDefaultScale() {
    this.scaleElement.style.removeProperty("font-size");
    const elements = {
      "container": this.canvas,
      "scale": this.scaleElement
    };
    let scaleValues = {};
    for (let key in elements) {
      const scaleStyles = getComputedStyle(elements[key]);
      const scaleValue = parseFloat(scaleStyles.getPropertyValue("font-size"));
      scaleValues[key] = scaleValue;
    }
    this.defaultScale = scaleValues.scale / scaleValues.container;
    return this.defaultScale;
  }
  getPages() {
    const pages = this.canvas.querySelectorAll(_Pdf.select("page"));
    this.pages = Array.from(pages);
    return this.pages;
  }
  getPageWrappers() {
    const pageWrappers = this.canvas.querySelectorAll(_Pdf.select("page-wrapper"));
    return Array.from(pageWrappers);
  }
  /**
   * Retrieves an array of `HTMLElement` objects representing design wrappers or design pages.
   *
   * - If no design IDs are provided, it returns **all** available designs.
   * - If one or more design IDs are provided, it returns only the designs whose `data-pdf-design` attribute matches the specified IDs.
   *
   * @param designs - Optional list of design IDs to filter by. If empty, all designs are returned.
   * @returns Array of matching `HTMLElement` elements.
   */
  getDesigns(...designs) {
    const designWrappers = Array.from(this.canvas.querySelectorAll(`[data-pdf-design]`));
    if (designs.length === 0) {
      return designWrappers;
    }
    const filteredDesigns = designWrappers.filter((wrapper) => {
      return designs.includes(wrapper.getAttribute("data-pdf-design") || "");
    });
    return filteredDesigns;
  }
  /**
   * Render any data of type `RenderData` on the pdf canvas.
   *
   * @param data Data of type `RenderData`. This data will be given to the Renderer instance to render it.
   */
  render(data) {
    this.pages.forEach((page) => {
      this.renderer.render(data, page);
    });
  }
  /**
   * Scales the PDF to the given value.
   *
   * @param scale Scale value in `em`, e.g. `0.3` will scale the canvas to `0.3em`.
   */
  scale(scale, store = true) {
    if (store) this.customScale = scale;
    this.scaleElement.style.fontSize = `${scale}em`;
  }
  resetScale() {
    this.scale(this.customScale);
  }
  resetDefaultScale() {
    const defaultScale = this.getDefaultScale();
    return this.scale(defaultScale);
  }
  freeze() {
    this.pages.forEach((page) => {
      this.freezeSelector = '*:not([pdf-freeze="exclude"], [pdf-freeze="exclude"] *, svg, svg *)';
      const children = page.querySelectorAll(this.freezeSelector);
      children.forEach((child) => {
        this.freezeElement(child);
      });
    });
  }
  freezeElement(element) {
    if (element.tagName === "svg") return;
    const elementRect = element.getBoundingClientRect();
    element.style.width = `${elementRect.width}px`;
    element.style.minWidth = `${elementRect.width}px`;
    element.style.maxWidth = `${elementRect.width}px`;
    element.style.height = `${elementRect.height}px`;
  }
  unFreeze() {
    this.pages.forEach((page) => {
      const children = page.querySelectorAll(this.freezeSelector);
      children.forEach((child) => {
        this.unFreezeElement(child);
      });
    });
  }
  unFreezeElement(element) {
    element.style.removeProperty("width");
    element.style.removeProperty("min-width");
    element.style.removeProperty("max-width");
    element.style.removeProperty("height");
    element.style.removeProperty("position");
    element.style.removeProperty("left");
    element.style.removeProperty("top");
    element.style.removeProperty("margin");
  }
  /**
   * @param page The current page element as an `HTMLElement`.
   * @param scale The scale of the canvas.
   * @returns The prepared `HTMLCanvasElement`.
   */
  prepareCanvas(page, scale) {
    if (!page) {
      throw new Error(`Pdf page not found.`);
    }
    const canvas = document.createElement("canvas");
    canvas.width = page.offsetWidth * scale;
    canvas.height = page.offsetHeight * scale;
    const ctx = canvas.getContext("2d");
    const originalDrawImage = ctx.drawImage;
    ctx.drawImage = function(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      if (image instanceof HTMLImageElement) {
        if (sw / dw < sh / dh) {
          const _dh = dh;
          dh = sh * (dw / sw);
          dy = dy + (_dh - dh) / 2;
        } else {
          const _dw = dw;
          dw = sw * (dh / sh);
          dx = dx + (_dw - dw) / 2;
        }
      }
      return originalDrawImage.call(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh);
    };
    return canvas;
  }
  isPageHidden(page) {
    return window.getComputedStyle(page).getPropertyValue("display") === "none" || window.getComputedStyle(page).getPropertyValue("visibility") === "hidden" || page.classList.contains("hide") || page.offsetWidth === 0 || page.offsetHeight === 0;
  }
  hyphenatePages(...pages) {
    if (!pages.length) pages = this.pages;
    pages.forEach((page) => {
      if (this.isPageHidden(page)) return;
      hyphenateDOM(page);
      finalizeHyphenation(page);
    });
  }
  async create(format) {
    this.freeze();
    const zoom = 0.1;
    const canvasScale = format === "a3" ? 2 * 4.17 : format === "a4" ? 1 * 4.17 : 0.5 * 4.17;
    const getHtml2CanvasOptions = (canvas) => {
      return {
        scale: canvasScale,
        useCORS: true,
        canvas
      };
    };
    try {
      const pdf = new jsPDF("portrait", "mm", format);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      let firstPage = true;
      for (let i = 0; i < this.pages.length; i++) {
        const page = this.pages[i];
        if (this.isPageHidden(page)) {
          console.warn(`Hidden page detected, skipping current page. 
Page:`, page);
          continue;
        }
        const defaultCanvas = this.prepareCanvas(page, canvasScale);
        const canvas = await html2canvas(page, getHtml2CanvasOptions(defaultCanvas));
        const imgData = canvas.toDataURL("image/png");
        const adjustedWidth = pdfWidth + 2 * zoom;
        const adjustedHeight = canvas.height * adjustedWidth / canvas.width;
        if (!firstPage) {
          pdf.addPage();
        }
        firstPage = false;
        pdf.addImage(imgData, "PNG", -zoom, -zoom, adjustedWidth, adjustedHeight, void 0, "SLOW");
      }
      return pdf;
    } catch (error) {
      console.error("Error creating PDF:", error);
    } finally {
      this.unFreeze();
    }
  }
  async save(format, filename, clientScale = 1) {
    filename = filename || `Dokument generiert am ${(/* @__PURE__ */ new Date()).toLocaleDateString("de-DE")}`;
    filename = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    this.scale(clientScale, false);
    setTimeout(async () => {
      const pdf = await this.create(format);
      pdf.save(filename);
      this.resetScale();
    }, 0);
  }
};
/**
 * Use this method to select the elements for a new `Pdf` instance.
 * @returns CSS selector string
 */
_Pdf.select = createAttribute("data-pdf-element");
let Pdf = _Pdf;
export {
  Pdf as default
};
