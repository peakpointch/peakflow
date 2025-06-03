export default function mapToObject(map: Map<any, any>, stringify: boolean = false): any {
  // Convert a Map to a plain object
  const obj: any = {};
  for (const [key, value] of map) {
    obj[key] =
      value instanceof Map
        ? mapToObject(value, stringify)
        : stringify
          ? JSON.stringify(value)
          : value; // Recursively convert if value is a Map
  }
  return obj;
}
