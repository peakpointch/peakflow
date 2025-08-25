import inlineCmsDefault from "../inlinecms/default.js";
import dateflowDefault from "../dateflow/default.js";
import { initVimePlayerDefault } from "../video/default.js";
import { initCopyComponents } from "../copy/index.js";
import { initUploadcareDefault } from "../form/uploadcare.js";

export type AnyFn = (...args: any[]) => any;
export type VoidFn = (...args: any[]) => void;

// instead of forcing PeakflowRegistry, let TS infer the literal key
export const defaultRegistry = {
  inlinecms: inlineCmsDefault,
  dateflow: dateflowDefault,
  vimePlayer: initVimePlayerDefault,
  copyComponent: initCopyComponents,
  uploadcare: initUploadcareDefault,
};
export type DefaultRegistry = typeof defaultRegistry;
