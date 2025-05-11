/**
 * Converts a string into a URL-friendly, kebab-case format.
 * 
 * @param {string} text - The input string to be parameterized.
 * @returns {string} - The parameterized string.
 */
export function parameterize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

/**
 * Converts a (lower)CamelCase string to a kebab-case string.
 *
 * @param {string} str - The input camelCase or PascalCase string.
 * @returns {string} - The resulting string in kebab-case format.
 */
export function toDashCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Converts a kebab-case string to camelCase.
 *
 * @param {string} str - The input kebab-case string.
 * @returns {string} - The resulting string in camelCase format.
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Capitalizes the first character of a string while leaving the rest unchanged.
 *
 * @param {string} str - The input string to be modified.
 * @returns {string} - The modified string with the first character capitalized.
 */
export function toDataset(str: string): string {
  return `${str.charAt(0).toUpperCase() + str.slice(1)}`;
}

