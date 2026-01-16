import type { PartialDeep } from "type-fest";
import { mergeOptions } from "../utils";
import { toDashCase } from "../utils";

export interface ObjectToCSSOptions {
  convertCasing: boolean;
  pretty: boolean;
  shiftWidth: number;
  depth: number;
}

const defaultObjectToCSSOptions: ObjectToCSSOptions = {
  convertCasing: true,
  pretty: false,
  shiftWidth: 2,
  depth: 0,
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
    currentIndent: " ".repeat(opts.shiftWidth * opts.depth),
    newline: "\n",
    space: " ",
  };

  if (!opts.pretty) {
    c.indent = "";
    c.currentIndent = "";
    c.newline = "";
    c.space = "";
  }

  return Object.entries(obj)
    .map(([key, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        const inner = objectToCSS(value, { ...opts, depth: opts.depth + 1 });
        return `${c.currentIndent}${key}${c.space}{${c.newline}${inner}${c.newline}${c.currentIndent}}${c.newline}`;
      }

      const prop = opts.convertCasing ? toDashCase(key) : key;
      return `${c.currentIndent}${prop}:${c.space}${value};`;
    })
    .join(c.newline);
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
  const opts = mergeOptions(defaultCSSBreakpointOptions, options);
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
