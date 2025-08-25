import inlineCmsDefault from "../inlinecms/default.js";
import dateflowDefault from "../dateflow/default.js";
import { initVimePlayerDefault } from "../video/default.js";
import { initCopyComponents } from "../copy/index.js";
import { initUploadcareDefault } from "../form/uploadcare.js";
// instead of forcing PeakflowRegistry, let TS infer the literal key
export const defaultRegistry = {
    inlinecms: inlineCmsDefault,
    dateflow: dateflowDefault,
    vimePlayer: initVimePlayerDefault,
    copyComponent: initCopyComponents,
    uploadcare: initUploadcareDefault,
};
