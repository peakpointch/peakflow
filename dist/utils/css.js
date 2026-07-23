import { mergeOptions } from "../utils/merge-options.js";
import { toDashCase } from "../utils/parameterize.js";
const defaultObjectToCSSOptions = {
    convertCasing: true,
    pretty: false,
    shiftWidth: 2,
    depth: 0,
};
export function objectToCSS(obj, options = {}) {
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
const defaultCSSBreakpointOptions = {
    unit: "px",
    mobileFirst: true,
};
export function breakpointsToMediaQueries(breakpoints, callback = (styles) => styles, options = {}) {
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
