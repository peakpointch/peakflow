import type { PartialDeep } from "type-fest";
import deepMerge from "./deepmerge.js";
import { toDashCase } from "./parameterize.js";

export interface ObjectToCSSOptions {
  brackets: boolean;
  convertCasing: boolean;
  pretty: boolean;
  shiftWidth: number;
}

const defaultObjectToCSSOptions: ObjectToCSSOptions = {
  brackets: true,
  convertCasing: true,
  pretty: false,
  shiftWidth: 2,
};

export type CSSRule = Record<string, gsap.CSSVars>;
export type CSSBreakpoint = Record<number, CSSRule>;
export type CSSMediaQuery = Record<string, CSSRule>;

export function objectToCSS(
  obj: CSSRule | CSSMediaQuery,
  options: PartialDeep<ObjectToCSSOptions> = {},
): string {
  const opts = { ...defaultObjectToCSSOptions, ...options };
  const c = {
    indent: " ".repeat(opts.shiftWidth),
    newline: "\n",
    space: " ",
  };

  if (!opts.pretty) {
    c.indent = "";
    c.newline = "";
    c.space = "";
  }

  return Object.entries(obj)
    .map(([key, value]) => {
      // 1. Handle Nested Objects (Selectors or Media Queries)
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const inner = objectToCSS(value, { ...opts, brackets: true });
        return `${key}${c.space}{${c.newline}${inner}}${c.newline.repeat(2)}`;
      }

      // 2. Handle Properties
      const prop = opts.convertCasing ? toDashCase(key) : key;
      return `${c.indent}${prop}:${c.space}${value};${c.newline}`;
    })
    .join("");
}

export type CSSUnit = "px" | "em" | "rem" | "%" | "vw" | "svw" | "vh" | "svh";

export interface CSSBreakpointOptions {
  unit: CSSUnit;
  mobileFirst: boolean;
}

const defaultCSSBreakpointOptions: CSSBreakpointOptions = {
  unit: "px",
  mobileFirst: true,
};
export function breakpointsToMediaQueries(
  breakpoints: CSSBreakpoint,
  callback: (styles: any) => CSSRule = (styles) => styles,
  options: PartialDeep<CSSBreakpointOptions> = {},
): CSSMediaQuery {
  const opts = deepMerge(defaultCSSBreakpointOptions, options);
  const mediaType = opts.mobileFirst ? "min-width" : "max-width";
  return Object.entries(breakpoints).reduce((acc, [width, styles]) => {
    const query = `@media screen and (${mediaType}: ${width}${opts.unit})`;

    return {
      ...acc,
      [query]: {
        ...callback(styles),
      },
    };
  }, {});
}
