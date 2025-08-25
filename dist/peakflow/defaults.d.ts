import inlineCmsDefault from "../inlinecms/default";
import dateflowDefault from "../dateflow/default";
import { initVimePlayerDefault } from "../video/default";
export type AnyFn = (...args: any[]) => any;
export type VoidFn = (...args: any[]) => void;
export declare const defaultRegistry: {
    inlinecms: typeof inlineCmsDefault;
    dateflow: typeof dateflowDefault;
    vimePlayer: typeof initVimePlayerDefault;
};
export type DefaultRegistry = typeof defaultRegistry;
