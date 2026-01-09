import type { PdfEmbedGlobal } from "../src";

export interface PeakflowGlobal {
  pdfEmbed: PdfEmbedGlobal;
}

declare global {
  interface Window {
    peakflow: PeakflowGlobal;
  }
}
