import inlineCmsDefault from "../inlinecms/default";
import dateflowDefault from "../dateflow/default";
import { initVimePlayerDefault } from "../video/default";
import { initCopyComponents } from "../copy";
export type AnyFn = (...args: any[]) => any;
export type VoidFn = (...args: any[]) => void;
export declare const defaultRegistry: {
    inlinecms: typeof inlineCmsDefault;
    dateflow: typeof dateflowDefault;
    vimePlayer: typeof initVimePlayerDefault;
    copyComponent: typeof initCopyComponents;
};
export type DefaultRegistry = typeof defaultRegistry;
