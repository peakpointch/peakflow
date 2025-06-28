/**
 * Converts a string into a URL-friendly, kebab-case format.
 *
 * @param {string} text - The input string to be parameterized.
 * @returns {string} - The parameterized string.
 */
export declare function parameterize(text: string): string;
/**
 * Converts a (lower)CamelCase string to a kebab-case string.
 *
 * @param {string} str - The input camelCase or PascalCase string.
 * @returns {string} - The resulting string in kebab-case format.
 */
export declare function toDashCase(str: string): string;
/**
 * Converts a kebab-case string to camelCase.
 *
 * @param {string} str - The input kebab-case string.
 * @returns {string} - The resulting string in camelCase format.
 */
export declare function toCamelCase(str: string): string;
/**
 * Capitalizes the first character of a string while leaving the rest unchanged.
 *
 * @param {string} str - The input string to be modified.
 * @returns {string} - The modified string with the first character capitalized.
 */
export declare function toDataset(str: string): string;
