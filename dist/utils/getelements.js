function getAllElements(input, options = {}) {
  const opts = {
    single: options.single ?? false,
    node: options.node ?? document
  };
  if (typeof input === "string") {
    const elements = Array.from(opts.node.querySelectorAll(input)).filter(Boolean);
    if (elements.length === 0) {
      throw new Error(`No elements found matching selector: ${input}`);
    } else if (opts.single) {
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
    throw new Error("Invalid input provided: must be a string, HTMLElement, array or node list.");
  }
}
function getElement(input, options = {}) {
  const opts = {
    single: options.single ?? true,
    node: options.node ?? document
  };
  if (typeof input === "string") {
    const elements = Array.from(opts.node.querySelectorAll(input));
    if (elements.length === 0) {
      throw new Error(`No elements found matching selector: "${input}".`);
    } else if (opts.single && elements.length > 1) {
      throw new Error(`More than 1 element found matching selector "${input}". Make your selector more specific.`);
    }
    return elements[0];
  } else if (input instanceof HTMLElement) {
    return input;
  } else {
    throw new Error("Invalid input provided: must be a string or HTMLElement.");
  }
}
export {
  getAllElements,
  getElement
};
