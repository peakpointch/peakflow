function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== void 0) {
      result[key] = sourceValue;
    }
  }
  return result;
}
function isPlainObject(value) {
  return value !== void 0 && value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
}
export {
  deepMerge as default
};
