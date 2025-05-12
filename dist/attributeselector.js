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
  return selector.split(", ").reduce((acc, str) => {
    let separator = acc === "" ? "" : ", ";
    return acc + separator + `${str}:not(${exclusions.join(", ")})`;
  }, "");
}
const createAttribute = (attrName, options = {
  defaultType: "exact",
  defaultValue: void 0,
  exclusions: []
}) => {
  return (name = options.defaultValue, type = options.defaultType) => {
    if (!name) {
      return exclude(`[${attrName}]`, ...options.exclusions);
    }
    const value = String(name);
    const selector = `[${attrName}${getOperator(type)}="${value}"]`;
    return exclude(selector, ...options.exclusions ?? []);
  };
};
var attributeselector_default = createAttribute;
export {
  attributeselector_default as default
};
