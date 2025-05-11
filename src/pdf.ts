import Renderer, { RenderData } from "@library/renderer";
import html2canvas from 'html2canvas';
import jsPDF, { Html2CanvasOptions } from 'jspdf';
import createAttribute from "@library/attributeselector";

// Types
export type PdfElement = 'container' | 'scale' | 'page' | 'page-wrapper' | 'weekday' | 'dish';
export type PdfFieldName = string | 'dishName' | 'dishDescription' | 'price' | 'priceSmall';
export type PdfFormat = 'a3' | 'a4' | 'a5';

// Variables

export default class Pdf {
  public canvas: HTMLElement;
  public renderer: Renderer;
  public defaultScale: number;
  public customScale: number;
  private freezeSelector: string;
  private scaleElement: HTMLElement;
  private pages: HTMLElement[];

  constructor(container: HTMLElement | null) {
    if (!container) throw new Error('PDF Element not found.');
    this.canvas = container;
    this.renderer = new Renderer(container, 'pdf');
    this.getPages();
    this.getScaleElement();
  }

  /**
   * Use this method to select the elements for a new `Pdf` instance.
   * @returns CSS selector string
   */
  static select = createAttribute<PdfElement>('data-pdf-element');

  private getScaleElement(): HTMLElement {
    const scale = this.canvas.querySelector<HTMLElement>(Pdf.select('scale'));
    if (!scale) {
      console.warn(`Scale element ${Pdf.select('scale')} is undefined.`)
      return;
    }
    this.scaleElement = scale;

    return this.scaleElement;
  }

  public getDefaultScale(): number {
    this.scaleElement.style.removeProperty('font-size');
    const elements: any = {
      "container": this.canvas,
      "scale": this.scaleElement,
    }
    let scaleValues: any = {};

    for (let key in elements) {
      const scaleStyles = getComputedStyle(elements[key]);
      const scaleValue = parseFloat(scaleStyles.getPropertyValue('font-size'));
      scaleValues[key] = scaleValue;
    }

    this.defaultScale = scaleValues.scale / scaleValues.container;
    return this.defaultScale;
  }

  public getPages(): HTMLElement[] {
    const pages = this.canvas.querySelectorAll<HTMLElement>(Pdf.select('page'));
    this.pages = Array.from(pages);
    return this.pages;
  }

  public getPageWrappers(): HTMLElement[] {
    const pageWrappers = this.canvas.querySelectorAll<HTMLElement>(Pdf.select('page-wrapper'));
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
  public getDesigns(...designs: string[]): HTMLElement[] {
    const designWrappers = Array.from(this.canvas.querySelectorAll<HTMLElement>(`[data-pdf-design]`));

    if (designs.length === 0) {
      return designWrappers;
    }

    const filteredDesigns = designWrappers.filter(wrapper => {
      return designs.includes(wrapper.getAttribute('data-pdf-design') || '');
    });

    return filteredDesigns;
  }

  /**
   * Render any data of type `RenderData` on the pdf canvas.
   *
   * @param data Data of type `RenderData`. This data will be given to the Renderer instance to render it.
   */
  public render(data: RenderData): void {
    this.pages.forEach(page => {
      this.renderer.render(data, page);
    });
  }

  /**
   * Scales the PDF to the given value.
   *
   * @param scale Scale value in `em`, e.g. `0.3` will scale the canvas to `0.3em`.
   */
  public scale(scale: number, store: boolean = true): void {
    if (store) this.customScale = scale;
    this.scaleElement.style.fontSize = `${scale}em`;
  }

  public resetScale(): void {
    this.scale(this.customScale);
  }

  public resetDefaultScale(): void {
    const defaultScale = this.getDefaultScale();
    return this.scale(defaultScale);
  }

  public freeze(): void {
    this.pages.forEach(page => {
      this.freezeSelector = '*:not([pdf-freeze="exclude"], [pdf-freeze="exclude"] *, svg, svg *)';
      const children: NodeListOf<HTMLElement> = page.querySelectorAll(this.freezeSelector);
      children.forEach(child => {
        this.freezeElement(child);
      });
    });
  }

  private freezeElement(element: HTMLElement): void {
    if (element.tagName === 'svg') return;

    const elementRect = element.getBoundingClientRect();

    element.style.width = `${elementRect.width}px`;
    element.style.minWidth = `${elementRect.width}px`;
    element.style.maxWidth = `${elementRect.width}px`;
    element.style.height = `${elementRect.height}px`;
  }

  public unFreeze(): void {
    this.pages.forEach(page => {
      const children: NodeListOf<HTMLElement> = page.querySelectorAll(this.freezeSelector);
      children.forEach(child => {
        this.unFreezeElement(child);
      });
    });
  }

  private unFreezeElement(element: HTMLElement): void {
    // Reset the inline styles to allow for dynamic layout adjustments
    element.style.removeProperty('width');
    element.style.removeProperty('min-width');
    element.style.removeProperty('max-width');
    element.style.removeProperty('height');
    element.style.removeProperty('position');
    element.style.removeProperty('left');
    element.style.removeProperty('top');
    element.style.removeProperty('margin');
  }

  /**
   * @param page The current page element as an `HTMLElement`.
   * @param scale The scale of the canvas.
   * @returns The prepared `HTMLCanvasElement`.
   */
  private prepareCanvas(page: HTMLElement, scale: number): HTMLCanvasElement {
    if (!page) {
      throw new Error(`Pdf page not found.`);
    }

    const canvas = document.createElement("canvas");
    canvas.width = page.offsetWidth * scale;
    canvas.height = page.offsetHeight * scale;

    const ctx = canvas.getContext("2d");
    const originalDrawImage = ctx.drawImage;

    // @ts-ignore
    ctx.drawImage = function (image: CanvasImageSource, sx: number, sy: number, sw: number, sh, dx, dy, dw, dh): void {
      if (image instanceof HTMLImageElement) {
        if (sw / dw < sh / dh) {
          const _dh = dh
          dh = sh * (dw / sw)
          dy = dy + (_dh - dh) / 2
        } else {
          const _dw = dw
          dw = sw * (dh / sh)
          dx = dx + (_dw - dw) / 2
        }
      }

      return originalDrawImage.call(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh)
    };

    return canvas;
  }

  private isPageHidden(page: HTMLElement): boolean {
    return window.getComputedStyle(page).getPropertyValue('display') === "none" ||
      window.getComputedStyle(page).getPropertyValue('visibility') === 'hidden' ||
      page.classList.contains("hide") ||
      page.offsetWidth === 0 ||
      page.offsetHeight === 0;
  }

  private async create(format: PdfFormat): Promise<jsPDF> {
    this.freeze();

    const zoom = 0.1; // crop 0.1mm on each side
    const canvasScale =
      format === "a3" ? 4
        : format === "a4" ? 2
          : 1;

    const getHtml2CanvasOptions = (canvas?: HTMLCanvasElement): Html2CanvasOptions => {
      return {
        scale: canvasScale,
        useCORS: true,
        canvas: canvas
      }
    }

    try {
      // Generate the PDF
      const pdf = new jsPDF('portrait', 'mm', format);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      let firstPage = true;

      for (let i = 0; i < this.pages.length; i++) {
        const page = this.pages[i];

        if (this.isPageHidden(page)) {
          console.warn(`Hidden page detected, skipping current page. \nPage:`, page);
          continue;
        }

        // Convert HTML element to canvas
        const defaultCanvas: HTMLCanvasElement = this.prepareCanvas(page, canvasScale);
        const canvas = await html2canvas(page, getHtml2CanvasOptions(defaultCanvas));
        const imgData = canvas.toDataURL('image/jpeg');

        const adjustedWidth = pdfWidth + 2 * zoom;
        const adjustedHeight = (canvas.height * adjustedWidth) / canvas.width;

        if (!firstPage) {
          pdf.addPage();
        }

        firstPage = false;

        pdf.addImage(imgData, 'JPEG', -zoom, -zoom, adjustedWidth, adjustedHeight, undefined, 'SLOW');
      }

      return pdf;
    } catch (error) {
      console.error('Error creating PDF:', error);
    } finally {
      this.unFreeze();
    }
  }

  public async save(format: PdfFormat, filename?: string, clientScale: number = 1): Promise<void> {
    // Save the PDF
    filename = filename || `Dokument generiert am ${new Date().toLocaleDateString('de-DE')}`;
    filename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    // Scale the pdf on client
    this.scale(clientScale, false);

    setTimeout(async () => {
      // Create the jsPDF instance
      const pdf = await this.create(format);
      pdf.save(filename);

      this.resetScale();
    }, 0);
  }
}
