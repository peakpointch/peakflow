import createAttribute from "./attributeselector";
export const defaultModalAnimation = {
    type: 'none',
    duration: 0,
    className: 'is-closed'
};
export const defaultModalSettings = {
    id: undefined,
    animation: defaultModalAnimation,
    stickyFooter: false,
    stickyHeader: false,
    lockBodyScroll: true,
};
class Modal {
    constructor(component, settings = {}) {
        this.initialized = false;
        if (!component) {
            throw new Error(`The component HTMLElement cannot be undefined.`);
        }
        this.component = component;
        this.settings = deepMerge(defaultModalSettings, settings);
        this.modal = this.getModalElement();
        this.instance = this.settings.id || component.getAttribute(Modal.attr.id);
        // accessibility
        this.component.setAttribute('role', 'dialog');
        this.component.setAttribute('aria-modal', 'true');
        this.setInitialState();
        this.setupStickyFooter();
        if (this.modal === this.component) {
            console.warn(`Modal: The modal instance was successfully initialized, but the "modal" element is equal to the "component" element, which will affect the modal animations. To fix this, add the "${Modal.selector('modal')}" attribute to a descendant of the component element. Find out more about the difference between the "component" and the "modal" element in the documentation.`);
        }
        this.initialized = true;
    }
    /**
     * Static selector
     */
    static selector(element, instance) {
        const base = Modal.attributeSelector(element);
        return instance
            ? `${base}[${Modal.attr.id}="${instance}"]`
            : base;
    }
    /**
     * Instance selector
     */
    selector(element, local = true) {
        return local
            ? Modal.selector(element, this.instance)
            : Modal.selector(element);
    }
    static select(element, instance) {
        return document.querySelector(Modal.selector(element, instance));
    }
    static selectAll(element, instance) {
        return document.querySelectorAll(Modal.selector(element, instance));
    }
    select(element, local = true) {
        return local
            ? this.component.querySelector(Modal.selector(element))
            : document.querySelector(Modal.selector(element, this.instance));
    }
    selectAll(element, local = true) {
        return local
            ? this.component.querySelectorAll(Modal.selector(element))
            : document.querySelectorAll(Modal.selector(element, this.instance));
    }
    getModalElement() {
        if (this.component.matches(Modal.selector('modal'))) {
            this.modal = this.component;
        }
        else {
            this.modal = this.component.querySelector(this.selector('modal'));
        }
        if (!this.modal)
            this.modal = this.component;
        return this.modal;
    }
    setupStickyFooter() {
        const modalContent = this.component.querySelector(Modal.selector('scroll'));
        const stickyFooter = this.component.querySelector(Modal.selector('sticky-bottom'));
        if (!modalContent || !stickyFooter) {
            console.warn("Initialize modal: skip sticky footer");
        }
        else {
            this.setupScrollEvent(modalContent, stickyFooter);
        }
    }
    setupScrollEvent(modalContent, stickyFooter) {
        modalContent.addEventListener("scroll", () => {
            const { scrollHeight, scrollTop, clientHeight } = modalContent;
            const isScrolledToBottom = scrollHeight - scrollTop <= clientHeight + 1;
            if (isScrolledToBottom) {
                // Remove scroll shadow
                stickyFooter.classList.remove("modal-scroll-shadow");
            }
            else {
                // If not scrolled to bottom, add scroll shadow
                stickyFooter.classList.add("modal-scroll-shadow");
            }
        });
    }
    setInitialState() {
        this.component.style.display = 'none';
        this.component.classList.remove('hide');
        this.hide();
        switch (this.settings.animation.type) {
            case 'fade':
                this.component.style.willChange = 'opacity';
                this.component.style.transitionProperty = 'opacity';
                this.component.style.transitionDuration = `${this.settings.animation.duration.toString()}ms`;
                break;
            case 'slideUp':
                this.component.style.willChange = 'opacity';
                this.component.style.transitionProperty = 'opacity';
                this.component.style.transitionDuration = `${this.settings.animation.duration.toString()}ms`;
                this.modal.style.willChange = 'transform';
                this.modal.style.transitionProperty = 'transform';
                this.modal.style.transitionDuration = `${this.settings.animation.duration.toString()}ms`;
                break;
            case 'none':
                break;
        }
        this.component.dataset.state = "closed";
    }
    async show() {
        this.component.dataset.state = "opening";
        this.component.style.removeProperty('display');
        await new Promise(resolve => setTimeout(resolve, 0));
        await animationFrame();
        switch (this.settings.animation.type) {
            case 'fade':
                this.component.style.opacity = '1';
                break;
            case 'slideUp':
                this.component.style.opacity = '1';
                this.modal.style.transform = 'translateY(0vh)';
                break;
            default:
                this.component.classList.remove("is-closed");
        }
        setTimeout(() => {
            this.component.dataset.state = "open";
        }, this.settings.animation.duration);
    }
    async hide() {
        this.component.dataset.state = "closing";
        switch (this.settings.animation.type) {
            case 'fade':
                this.component.style.opacity = '0';
                break;
            case 'slideUp':
                this.component.style.opacity = '0';
                this.modal.style.transform = 'translateY(10vh)';
                break;
            default:
                break;
        }
        const finish = new Promise(resolve => {
            setTimeout(() => {
                this.component.style.display = "none";
                this.component.dataset.state = "closed";
                resolve();
            }, this.settings.animation.duration);
        });
        await finish;
    }
    /**
     * Opens the modal instance.
     *
     * This method calls the `show` method and locks the scroll of the document body.
     */
    open() {
        this.show();
        if (this.settings.lockBodyScroll) {
            lockBodyScroll();
        }
    }
    /**
     * Closes the modal instance.
     *
     * This method calls the `hide` method and unlocks the scroll of the document body.
     */
    close() {
        if (this.settings.lockBodyScroll) {
            unlockBodyScroll();
        }
        this.hide();
    }
}
Modal.attr = {
    id: 'data-modal-id',
    element: 'data-modal-element',
};
Modal.attributeSelector = createAttribute(Modal.attr.element);
export default Modal;
/**
 * Locks the scroll on the document body.
 *
 * This function sets the `overflow` style of the `body` element to `"hidden"`,
 * preventing the user from scrolling the page. Commonly used when displaying
 * modals, overlays, or other components that require the page to remain static.
 */
function lockBodyScroll() {
    document.body.style.overflow = "hidden";
}
/**
 * Unlocks the scroll on the document body.
 *
 * This function removes the `overflow` style from the `body` element,
 * allowing the user to scroll the page again. Typically used when hiding
 * modals, overlays, or other components that previously locked scrolling.
 */
function unlockBodyScroll() {
    document.body.style.removeProperty("overflow");
}
function animationFrame() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}
/**
 * Deeply merges two objects, giving precedence to the properties in the `source` object.
 *
 * This function is particularly useful when working with configuration objects
 * where you want to provide defaults and allow overrides at any level of nesting.
 *
 * @template T The type of the target and resulting merged object.
 * @param {T} target - The base object containing default values.
 * @param {Partial<T>} source - An object with partial overrides to apply to the target.
 * @returns {T} A new object resulting from deeply merging `source` into `target`.
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key], source[key]);
        }
        else if (source[key] !== undefined) {
            result[key] = source[key];
        }
    }
    return result;
}
