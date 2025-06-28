/**
 * Deeply merges two objects, giving precedence to the properties in the `source` object.
 * 
 * This function is particularly useful when working with configuration objects
 * where you want to provide defaults and allow overrides at any level of nesting.
 *
 * @template T The type of the target and resulting merged object.
 * @param {T} target - The base object containing default values.
 * @param {Partial<T>} source - An object with partial overrides to apply to the target.
 * @returns {T} A new object resulting from deeply merging `source` into `target`.
 */
export default function deepMerge<T>(target: T, source: Partial<T>): T {
  const result: any = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  }

  return result;
}

function isPlainObject(value: any): value is Record<string, any> {
  return (
    value !== undefined &&
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
