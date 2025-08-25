const attrMatchTypes = {
    startsWith: "^",
    endsWith: "$",
    includes: "*",
    whitespace: "~",
    hyphen: "|",
    exact: "",
};
/**
 * Converts a human-friendly `AttributeType` to a CSS `AttributeOperator`.
 */
function getOperator(type) {
    return attrMatchTypes[type] || "";
}
/**
 * Excludes a CSS selector from a CSS selector.
 *
 * @param selector The original selector that should exclude specific elements.
 * @param exclusions The selectors to exclude from the original selector.
 * @returns A CSS selector.
 */
export function exclude(selector, ...exclusions) {
    if (exclusions.length === 0)
        return selector;
    return extend(selector, `:not(${exclusions.join(", ")})`);
}
export function extend(selector, ...extensions) {
    if (extensions.length === 0)
        return selector;
    const selectors = split(selector);
    const selectorsWithExtensions = extensions.map((extension) => {
        return append(selectors, extension);
    });
    return selectorsWithExtensions.join(", ");
}
export function append(selectorList, suffix) {
    return selectorList.reduce((acc, string) => {
        const prefix = acc === "" ? "" : `${acc}, `;
        return `${prefix}${string}${suffix}`;
    }, "");
}
export function split(selector) {
    const result = [];
    let current = "";
    let depth = 0;
    let i = 0;
    while (i < selector.length) {
        const char = selector[i];
        if (char === "(") {
            depth++;
        }
        else if (char === ")") {
            depth--;
        }
        if (char === "," && depth === 0) {
            result.push(current.trim());
            current = "";
            i++; // skip comma
            while (selector[i] === " ")
                i++; // skip all spaces after comma
            continue;
        }
        current += char;
        i++;
    }
    if (current.trim()) {
        result.push(current.trim());
    }
    return result;
}
/**
 * Creates a selector function based on the provided attribute name.
 * The returned selector function can be used to generate a string selector for the given name.
 * If no name is provided, it will return a selector with just the attribute name.
 *
 * @template T - The type of the name that will be passed to the generated selector function (e.g., string).
 * @param attrName - The name of the attribute that will be used in the selector.
 * @param defaultOptions - Options to configure selector generation.
 * @returns A function that generates the selector string based on the provided name and match type.
 */
export const createAttribute = (attrName, defaultOptions) => {
    const mergedDefaultOptions = {
        defaultMatchType: defaultOptions?.defaultMatchType ?? "exact",
        defaultValue: defaultOptions?.defaultValue ?? undefined,
        defaultExclusions: defaultOptions?.defaultExclusions ?? [],
    };
    return (name = mergedDefaultOptions.defaultValue, options) => {
        const mergedOptions = {
            matchType: options?.matchType ?? mergedDefaultOptions.defaultMatchType,
            exclusions: options?.exclusions ?? mergedDefaultOptions.defaultExclusions,
        };
        if (!name) {
            return exclude(`[${attrName}]`, ...mergedOptions.exclusions);
        }
        const value = String(name); // Ensure it's a string for selector use
        const selector = `[${attrName}${getOperator(mergedOptions.matchType)}="${value}"]`;
        return exclude(selector, ...(mergedOptions.exclusions ?? []));
    };
};
