/**
 * Finds one or multiple elements based on input type.
 * @param input - CSS selector or HTMLElement(s).
 * @param multiple - Whether to fetch multiple elements.
 * @returns An array of HTMLElements (or throws an error if not found).
 */
export default function findElements(input: string | HTMLElement | HTMLElement[], multiple?: boolean): HTMLElement[];
