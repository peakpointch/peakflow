class EditableCanvas {
  constructor(canvas, ...customSelectors) {
    this.elements = { all: [], hidden: [] };
    this.defaultSelector = '[data-canvas-editable="true"]';
    this.selectAll = this.defaultSelector;
    if (!canvas) throw new Error(`Canvas can't be undefined.`);
    this.canvas = canvas;
    if (customSelectors && customSelectors.length) {
      this.selectAll = `${this.selectAll}, ${customSelectors.join(", ")}`;
    }
    this.elements.all = Array.from(this.canvas.querySelectorAll(this.selectAll));
    this.canvas.querySelectorAll(`[data-canvas-editable]:not(${this.defaultSelector})`).forEach((element) => element.classList.remove("canvas-editable"));
    this.initialize();
  }
  initialize() {
    this.elements.all.forEach((element) => {
      element.classList.add("canvas-editable");
      this.attachEditListener(element);
    });
    this.attachDocumentListener();
  }
  update() {
    this.cleanupListeners();
    this.elements.all = Array.from(this.canvas.querySelectorAll(this.selectAll));
    this.initialize();
  }
  /**
   * Enable editing for a specific element.
   */
  enableEditing(element) {
    element.contentEditable = "true";
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        this.disableEditing(element);
      }
      if (event.ctrlKey && event.key === "d") {
        event.preventDefault();
        const hiddenElement = event.target;
        hiddenElement.style.display = "none";
        this.elements.hidden.push(hiddenElement);
      }
    };
    element.addEventListener("keydown", handleEscape);
    element._escapeListener = handleEscape;
  }
  showHiddenElements() {
    this.elements.hidden.forEach((e) => e.style.removeProperty("display"));
  }
  /**
   * Disable editing for a specific element.
   */
  disableEditing(element) {
    element.contentEditable = "false";
    const handleEscape = element._escapeListener;
    if (handleEscape) {
      element.removeEventListener("keydown", handleEscape);
      delete element._escapeListener;
    }
  }
  /**
   * Attach a click listener to enable editing for an element.
   */
  attachEditListener(element) {
    const handleClick = () => this.enableEditing(element);
    element.addEventListener("click", handleClick);
    element._clickListener = handleClick;
  }
  /**
   * Attach a document-wide listener to disable editing when clicking outside editable elements.
   */
  attachDocumentListener() {
    const handleDocumentClick = (event) => {
      if (!event.target || !(event.target instanceof HTMLElement) || !event.target.closest(this.selectAll)) {
        this.elements.all.forEach((element) => this.disableEditing(element));
      }
    };
    document.addEventListener("click", handleDocumentClick);
    this._documentClickListener = handleDocumentClick;
  }
  /**
   * Cleanup method to remove all dynamically added listeners.
   * Call this method if the instance is being destroyed.
   */
  cleanupListeners() {
    this.elements.all.forEach((element) => {
      const clickListener = element._clickListener;
      const escapeListener = element._escapeListener;
      if (clickListener) element.removeEventListener("click", clickListener);
      if (escapeListener) element.removeEventListener("keydown", escapeListener);
    });
    const documentClickListener = this._documentClickListener;
    if (documentClickListener) document.removeEventListener("click", documentClickListener);
  }
}
export {
  EditableCanvas as default
};
