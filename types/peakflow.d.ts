import type { Webflow } from "../src/webflow";

export type PeakflowShared = Record<string, any>;

export interface PeakflowGlobal {
  webflow: Webflow;
  shared: PeakflowShared;
}

declare global {
  interface Window {
    peakflow: PeakflowGlobal;
  }
}
