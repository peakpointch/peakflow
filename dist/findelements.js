function findElements(input, multiple = false) {
  if (typeof input === "string") {
    const elements = multiple ? Array.from(document.querySelectorAll(input)) : [document.querySelector(input)].filter(Boolean);
    if (elements.length === 0) {
      throw new Error(`No elements found matching selector: ${input}`);
    }
    return elements;
  } else if (input instanceof HTMLElement) {
    return [input];
  } else if (Array.isArray(input)) {
    return input;
  }
  throw new Error("Invalid input provided: must be a string, HTMLElement, or array.");
}
export {
  findElements as default
};
