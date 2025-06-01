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
  return result.map((sel) => `${sel}:not(${exclusions.join(", ")})`).join(", ");
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
var attributeselector_default = createAttribute;
export {
  attributeselector_default as default,
  exclude
};
