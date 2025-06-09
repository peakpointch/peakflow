function mapToObject(map, stringify = false) {
  const obj = {};
  for (const [key, value] of map) {
    obj[key] = value instanceof Map ? mapToObject(value, stringify) : stringify ? JSON.stringify(value) : value;
  }
  return obj;
}
export {
  mapToObject as default
};
