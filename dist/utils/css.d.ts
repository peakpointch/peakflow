import type { PartialDeep } from "type-fest";
export interface ObjectToCSSOptions {
    convertCasing: boolean;
    pretty: boolean;
    shiftWidth: number;
    depth: number;
}
export type CSSRule = Record<string, gsap.CSSVars>;
export type CSSBreakpoint = Record<number, CSSRule>;
export type CSSMediaQuery = Record<string, CSSRule>;
export declare function objectToCSS(obj: CSSRule | CSSMediaQuery, options?: PartialDeep<ObjectToCSSOptions>): string;
export type CSSUnit = "px" | "em" | "rem" | "%" | "vw" | "svw" | "vh" | "svh";
export interface CSSBreakpointOptions {
    unit: CSSUnit;
    mobileFirst: boolean;
}
export declare function breakpointsToMediaQueries(breakpoints: CSSBreakpoint, callback?: (styles: any) => CSSRule, options?: PartialDeep<CSSBreakpointOptions>): CSSMediaQuery;
