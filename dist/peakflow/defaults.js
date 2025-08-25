import inlineCmsDefault from "../inlinecms/default";
import dateflowDefault from "../dateflow/default";
import { initVimePlayerDefault } from "../video/default";
import { initCopyComponents } from "../copy";
// instead of forcing PeakflowRegistry, let TS infer the literal key
export const defaultRegistry = {
    inlinecms: inlineCmsDefault,
    dateflow: dateflowDefault,
    vimePlayer: initVimePlayerDefault,
    copyComponent: initCopyComponents,
};
