const attrMatchTypes = {
  startsWith: "^",
  endsWith: "$",
  includes: "*",
  whitespace: "~",
  hyphen: "|",
  exact: ""
};
function getOperator(type) {
  return attrMatchTypes[type] || "";
}
function exclude(selector, ...exclusions) {
  if (exclusions.length === 0) return selector;
  return extend(selector, `:not(${exclusions.join(", ")})`);
}
function extend(selector, ...extensions) {
  if (extensions.length === 0) return selector;
  const selectors = split(selector);
  const selectorsWithExtensions = extensions.map((extension) => {
    return append(selectors, extension);
  });
  return selectorsWithExtensions.join(", ");
}
function append(selectorList, suffix) {
  return selectorList.reduce((acc, string) => {
    const prefix = acc === "" ? "" : `${acc}, `;
    return `${prefix}${string}${suffix}`;
  }, "");
}
function split(selector) {
  const result = [];
  let current = "";
  let depth = 0;
  let i = 0;
  while (i < selector.length) {
    const char = selector[i];
    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
    }
    if (char === "," && depth === 0) {
      result.push(current.trim());
      current = "";
      i++;
      while (selector[i] === " ") i++;
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
const createAttribute = (attrName, defaultOptions) => {
  const mergedDefaultOptions = {
    defaultMatchType: defaultOptions?.defaultMatchType ?? "exact",
    defaultValue: defaultOptions?.defaultValue ?? void 0,
    defaultExclusions: defaultOptions?.defaultExclusions ?? []
  };
  return (name = mergedDefaultOptions.defaultValue, options) => {
    const mergedOptions = {
      matchType: options?.matchType ?? mergedDefaultOptions.defaultMatchType,
      exclusions: options?.exclusions ?? mergedDefaultOptions.defaultExclusions
    };
    if (!name) {
      return exclude(`[${attrName}]`, ...mergedOptions.exclusions);
    }
    const value = String(name);
    const selector = `[${attrName}${getOperator(mergedOptions.matchType)}="${value}"]`;
    return exclude(selector, ...mergedOptions.exclusions ?? []);
  };
};
export {
  append,
  createAttribute,
  exclude,
  extend,
  split
};
