function objectToMap(obj, deep = false) {
  const map = /* @__PURE__ */ new Map();
  for (const [key, value] of Object.entries(obj)) {
    if (deep && value instanceof Object && !(value instanceof Map)) {
      map.set(key, objectToMap(value, true));
    } else {
      map.set(key, value);
    }
  }
  return map;
}
export {
  objectToMap as default
};
