import type { PdfEmbedGlobal } from "../src/pdf";
import type { Webflow } from "../src/webflow";

export type PeakflowShared = Record<string, any>;

export interface PeakflowGlobal {
  pdfEmbed: PdfEmbedGlobal;
  webflow: Webflow;
  shared: PeakflowShared;
}

declare global {
  interface Window {
    peakflow: PeakflowGlobal;
  }
}
