function freezeGridChild(element: HTMLElement): void {
  element.style.height = "100%";
}

export function freezeElement(element: HTMLElement): void {
  if (element.tagName.toLowerCase() === "svg") return;

  const rect = element.getBoundingClientRect();

  element.style.width = `${rect.width}px`;
  element.style.minWidth = `${rect.width}px`;
  element.style.maxWidth = `${rect.width}px`;
  element.style.height = `${rect.height}px`;

  if (element.matches('[data-pdf-freeze="grid"]>*')) {
    freezeGridChild(element);
  }
}

export function unFreezeElement(element: HTMLElement): void {
  // Reset the inline styles to allow for dynamic layout adjustments
  element.style.removeProperty("width");
  element.style.removeProperty("min-width");
  element.style.removeProperty("max-width");
  element.style.removeProperty("height");
  element.style.removeProperty("position");
  element.style.removeProperty("left");
  element.style.removeProperty("top");
  element.style.removeProperty("margin");
}
