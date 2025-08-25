import inlineCmsDefault from "../inlinecms/default.js";
import dateflowDefault from "../dateflow/default.js";
import { initVimePlayerDefault } from "../video/default.js";
import { initCopyComponents } from "../copy/index.js";
import { initUploadcareDefault } from "../form/uploadcare.js";
export type AnyFn = (...args: any[]) => any;
export type VoidFn = (...args: any[]) => void;
export declare const defaultRegistry: {
    inlinecms: typeof inlineCmsDefault;
    dateflow: typeof dateflowDefault;
    vimePlayer: typeof initVimePlayerDefault;
    copyComponent: typeof initCopyComponents;
    uploadcare: typeof initUploadcareDefault;
};
export type DefaultRegistry = typeof defaultRegistry;
