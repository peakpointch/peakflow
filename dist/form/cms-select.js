import createAttribute from "../attributeselector";
import { getAllElements, getElement } from "../utils/getelements";
const _CMSSelect = class _CMSSelect {
  constructor(component) {
    this.attr = {
      element: "data-cms-select-element",
      prefix: "data-cms-select-prefix",
      value: "data-cms-select-value",
      wait: "data-cms-select-wait",
      status: "data-cms-select-status"
    };
    this.selector = createAttribute("data-cms-select-element");
    try {
      this.source = getElement(component);
      if (!this.source) {
        throw new Error(`Source list element is not defined.`);
      }
      this.waitEvent = this.source.dataset.formSelectWait || null;
      this.targets = getAllElements(this.selector("target"));
      this.readValues();
    } catch (e) {
      console.error(`Failed to create CMSSelect instance: ${e.message}`);
    }
  }
  static initializeAll() {
    try {
      const sourceLists = getAllElements(_CMSSelect.selector("source"));
      sourceLists.forEach((list) => {
        const cmsSelect = new _CMSSelect(list);
        if (cmsSelect.initWaitEvent(true)) return;
        cmsSelect.insertSelectOptions();
      });
    } catch (e) {
      console.error(`Failed to initialize all CMS select components: ${e.message}`);
    }
  }
  static createOption(value) {
    const optionElement = document.createElement("option");
    optionElement.setAttribute("value", value);
    optionElement.innerText = value;
    return optionElement;
  }
  /**
   * @param graceful Whether to throw an error if the wait event is invalid.
   * @returns A boolean indicating whether the wait event was initialized successfully.
   */
  initWaitEvent(graceful = false) {
    if (this.waitEvent) {
      this.source.addEventListener(this.waitEvent, () => {
        this.insertSelectOptions();
      });
      return true;
    } else {
      const message = `The wait event name "${this.waitEvent}" is invalid.`;
      if (graceful) return false;
      throw new Error(message);
    }
  }
  readValues() {
    this.values = [];
    const optionElements = this.source.querySelectorAll(_CMSSelect.selector("option"));
    optionElements.forEach((element) => {
      this.values.push(this.getSelectValue(element));
    });
  }
  insertSelectOptions(targets = this.targets) {
    this.values.forEach((val) => {
      if (val) {
        const option = _CMSSelect.createOption(val);
        targets.forEach((target) => target.appendChild(option));
      } else {
        console.warn("CMS select: skip empty option");
      }
    });
  }
  getSelectValue(item) {
    const prefix = item.getAttribute(this.attr.prefix) || "";
    const value = item.getAttribute(this.attr.value) || "";
    const optionValue = prefix ? `${prefix} ${value}` : value;
    return optionValue;
  }
};
_CMSSelect.selector = createAttribute("data-cms-select-element");
let CMSSelect = _CMSSelect;
export {
  CMSSelect as default
};
