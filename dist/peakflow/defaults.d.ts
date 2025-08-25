import inlineCmsDefault from "../inlinecms/default";
import dateflowDefault from "../dateflow/default";
export type AnyFn = (...args: any[]) => any;
export type VoidFn = (...args: any[]) => void;
export declare const defaultRegistry: {
    inlinecms: typeof inlineCmsDefault;
    dateflow: typeof dateflowDefault;
};
export type DefaultRegistry = typeof defaultRegistry;
