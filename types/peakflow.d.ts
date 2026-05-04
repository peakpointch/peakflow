import type { PdfEmbedGlobal } from "../src/pdf";
import type { Webflow } from "../src/webflow";

export interface PeakflowGlobal {
  pdfEmbed: PdfEmbedGlobal;
  webflow: Webflow;
}

declare global {
  interface Window {
    peakflow: PeakflowGlobal;
  }
}
