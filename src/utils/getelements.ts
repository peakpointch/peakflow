/**
 * Finds one or multiple elements based on input type.
 * @param input - CSS selector or HTMLElement(s).
 * @param single - Whether to fetch multiple elements. Defaults to false.
 * @returns An array of HTMLElements (or throws an error if not found).
 */
export function getAllElements<T extends HTMLElement = HTMLElement>(
  input: string | T | T[] | NodeListOf<T>,
  single: boolean = false
): T[] {
  if (typeof input === 'string') {
    const elements = Array.from(document.querySelectorAll<T>(input)).filter(Boolean);
    if (elements.length === 0) {
      throw new Error(`No elements found matching selector: ${input}`);
    } else if (single) {
      return [elements[0]];
    } else {
      return elements;
    }
  } else if (input instanceof HTMLElement) {
    return [input];
  } else if (Array.isArray(input)) {
    return input;
  } else if (input instanceof NodeList) {
    return Array.from(input);
  } else {
    throw new Error('Invalid input provided: must be a string, HTMLElement, array or node list.');
  }
}

export function getElement<T extends HTMLElement = HTMLElement>(
  input: string | T,
  singleOnly: boolean = true
): T {
  if (typeof input === 'string') {
    const elements = Array.from(document.querySelectorAll<T>(input));

    if (elements.length === 0) {
      throw new Error(`No elements found matching selector: "${input}".`);
    } else if (singleOnly && elements.length > 1) {
      throw new Error(`More than 1 element found matching selector "${input}". Make your selector more specific.`);
    }

    return elements[0];
  } else if (input instanceof HTMLElement) {
    return input;
  } else {
    throw new Error('Invalid input provided: must be a string or HTMLElement.');
  }
}
