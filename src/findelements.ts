/**
 * Finds one or multiple elements based on input type.
 * @param input - CSS selector or HTMLElement(s).
 * @param multiple - Whether to fetch multiple elements.
 * @returns An array of HTMLElements (or throws an error if not found).
 */
export default function findElements(
  input: string | HTMLElement | HTMLElement[],
  multiple: boolean = false
): HTMLElement[] {
  if (typeof input === "string") {
    const elements = multiple
      ? Array.from(document.querySelectorAll(input))
      : [document.querySelector(input)].filter(Boolean);
    if (elements.length === 0) {
      throw new Error(`No elements found matching selector: ${input}`);
    }
    return elements as HTMLElement[];
  } else if (input instanceof HTMLElement) {
    return [input];
  } else if (Array.isArray(input)) {
    return input;
  }
  throw new Error("Invalid input provided: must be a string, HTMLElement, or array.");
}
