import inlineCmsDefault from "../inlinecms/default";
import dateflowDefault from "../dateflow/default";

export type AnyFn = (...args: any[]) => any;
export type VoidFn = (...args: any[]) => void;

// instead of forcing PeakflowRegistry, let TS infer the literal key
export const defaultRegistry = {
  inlinecms: inlineCmsDefault,
  dateflow: dateflowDefault,
};

export type DefaultRegistry = typeof defaultRegistry;
