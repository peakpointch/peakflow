function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== void 0) {
      result[key] = source[key];
    }
  }
  return result;
}
export {
  deepMerge as default
};
