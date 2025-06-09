/**
 * Converts an object to a `Map`. The function can perform either shallow or deep conversion based on the `deep` argument.
 *
 * @param {any} obj - The object to be converted to a `Map`. It can be any type, including nested objects.
 * @param {boolean} [deep=false] - A flag that determines whether the conversion should be deep (recursive) or shallow.
 * If set to `true`, nested objects will be recursively converted into `Map` objects. If set to `false`, only the top-level
 * properties will be converted, and nested objects will remain as plain objects.
 *
 * @returns {Map<any, any>} A `Map` object representing the input `obj`, where keys are the same as the object's
 * properties and values are the corresponding values of those properties.
 */
export default function objectToMap(obj: any, deep: boolean = false): Map<any, any> {
  const map = new Map();
  for (const [key, value] of Object.entries(obj)) {
    // Check if deep conversion is requested
    if (deep && value instanceof Object && !(value instanceof Map)) {
      map.set(key, objectToMap(value, true)); // Recursively convert nested objects
    } else {
      map.set(key, value); // Set the value as is for shallow conversion or non-objects
    }
  }
  return map;
}
