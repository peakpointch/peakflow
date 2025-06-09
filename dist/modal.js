import createAttribute from "./attributeselector";
import deepMerge from "./deepmerge";
import {
  adjustPaddingForScrollbar,
  lockBodyScroll,
  resetScrollbarPadding,
  unlockBodyScroll
} from "./scroll/lock";
import { createScrollTo } from "./scroll/scrollto";
const defaultModalAnimation = {
  type: "none",
  duration: 0,
  className: "is-closed"
};
const defaultModalSettings = {
  id: void 0,
  animation: defaultModalAnimation,
  stickyFooter: false,
  stickyHeader: false,
  bodyScroll: {
    lock: true,
    smooth: false
  }
};
const _Modal = class _Modal {
  constructor(component, settings = {}) {
    this.initialized = false;
    this.scrollTimeoutId = null;
    if (!component) {
      throw new Error(`The component HTMLElement cannot be undefined.`);
    }
    this.component = component;
    this.settings = deepMerge(defaultModalSettings, settings);
    this.modal = this.getModalElement();
    this.instance = this.settings.id || component.getAttribute(_Modal.attr.id);
    component.setAttribute(_Modal.attr.id, this.instance);
    this.component.setAttribute("role", "dialog");
    this.component.setAttribute("aria-modal", "true");
    this.setupScrollTo();
    this.setInitialState();
    this.setupStickyFooter();
    if (this.modal === this.component) {
      console.warn(`Modal: The modal instance was successfully initialized, but the "modal" element is equal to the "component" element, which will affect the modal animations. To fix this, add the "${_Modal.selector("modal")}" attribute to a descendant of the component element. Find out more about the difference between the "component" and the "modal" element in the documentation.`);
    }
    this.initialized = true;
  }
  /**
   * Static selector
   */
  static selector(element, instance) {
    const base = _Modal.attributeSelector(element);
    return instance ? `${base}[${_Modal.attr.id}="${instance}"]` : base;
  }
  /**
   * Instance selector
   */
  selector(element, local = true) {
    return local ? _Modal.selector(element, this.instance) : _Modal.selector(element);
  }
  static select(element, instance) {
    return document.querySelector(_Modal.selector(element, instance));
  }
  static selectAll(element, instance) {
    return document.querySelectorAll(_Modal.selector(element, instance));
  }
  select(element, local = true) {
    return local ? this.component.querySelector(_Modal.selector(element)) : document.querySelector(_Modal.selector(element, this.instance));
  }
  selectAll(element, local = true) {
    return local ? this.component.querySelectorAll(_Modal.selector(element)) : document.querySelectorAll(_Modal.selector(element, this.instance));
  }
  getModalElement() {
    if (this.component.matches(_Modal.selector("modal"))) {
      this.modal = this.component;
    } else {
      this.modal = this.component.querySelector(this.selector("modal"));
    }
    if (!this.modal) this.modal = this.component;
    return this.modal;
  }
  setupScrollTo() {
    const scrollHandler = createScrollTo({
      scrollWrapper: this.modal,
      stickyTop: this.select("sticky-top"),
      stickyBottom: this.select("sticky-bottom")
    });
    this.scrollTo = scrollHandler.scrollTo;
    this.clearScrollTimeout = scrollHandler.clearScrollTimeout;
  }
  setupStickyFooter() {
    const modalContent = this.component.querySelector(_Modal.selector("scroll"));
    const stickyFooter = this.component.querySelector(_Modal.selector("sticky-bottom"));
    if (!modalContent || !stickyFooter) {
      console.warn("Initialize modal: skip sticky footer");
    } else {
      this.setupScrollEvent(modalContent, stickyFooter);
    }
  }
  setupScrollEvent(modalContent, stickyFooter) {
    modalContent.addEventListener("scroll", () => {
      const { scrollHeight, scrollTop, clientHeight } = modalContent;
      const isScrolledToBottom = scrollHeight - scrollTop <= clientHeight + 1;
      if (isScrolledToBottom) {
        stickyFooter.classList.remove("modal-scroll-shadow");
      } else {
        stickyFooter.classList.add("modal-scroll-shadow");
      }
    });
  }
  setInitialState() {
    this.component.style.display = "none";
    this.component.classList.remove("hide");
    this.hide();
    switch (this.settings.animation.type) {
      case "growIn":
      case "slideUp":
        this.modal.style.willChange = "transform";
        this.modal.style.transitionProperty = "transform";
        this.modal.style.transitionDuration = `${this.settings.animation.duration.toString()}ms`;
      case "fade":
        this.component.style.willChange = "opacity";
        this.component.style.transitionProperty = "opacity";
        this.component.style.transitionDuration = `${this.settings.animation.duration.toString()}ms`;
        break;
      case "none":
        break;
    }
    this.component.dataset.state = "closed";
  }
  async show() {
    this.component.style.removeProperty("display");
    await animationFrame();
    switch (this.settings.animation.type) {
      case "fade":
        this.component.style.opacity = "1";
        break;
      case "slideUp":
        this.component.style.opacity = "1";
        this.modal.style.transform = "translateY(0vh)";
        break;
      case "growIn":
        this.component.style.opacity = "1";
        this.modal.style.transform = "scale(1)";
        break;
      default:
        this.component.classList.remove("is-closed");
    }
    setTimeout(() => {
    }, this.settings.animation.duration);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, this.settings.animation.duration);
    });
  }
  async hide() {
    await animationFrame();
    switch (this.settings.animation.type) {
      case "fade":
        this.component.style.opacity = "0";
        break;
      case "slideUp":
        this.component.style.opacity = "0";
        this.modal.style.transform = "translateY(10vh)";
        break;
      case "growIn":
        this.component.style.opacity = "0";
        this.modal.style.transform = "scale(0.9)";
        break;
      default:
        break;
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        this.component.style.display = "none";
        resolve();
      }, this.settings.animation.duration);
    });
  }
  /**
   * Opens the modal instance.
   *
   * This method calls the `show` method and locks the scroll of the document body.
   */
  async open() {
    this.component.dataset.state = "opening";
    if (this.settings.bodyScroll.lock) {
      adjustPaddingForScrollbar(this.component, document.body);
      lockBodyScroll(this.settings.bodyScroll.smooth);
    }
    await this.show();
    this.opened = true;
    this.component.dataset.state = "open";
  }
  /**
   * Closes the modal instance.
   *
   * This method calls the `hide` method and unlocks the scroll of the document body.
   */
  async close() {
    this.component.dataset.state = "closing";
    if (this.settings.bodyScroll.lock) {
      resetScrollbarPadding(this.component);
      unlockBodyScroll(this.settings.bodyScroll.smooth);
    }
    await this.hide();
    this.opened = false;
    this.component.dataset.state = "closed";
  }
};
_Modal.attr = {
  id: "data-modal-id",
  element: "data-modal-element"
};
_Modal.attributeSelector = createAttribute(_Modal.attr.element);
let Modal = _Modal;
function animationFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
export {
  Modal as default,
  defaultModalAnimation,
  defaultModalSettings
};
