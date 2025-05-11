import createAttribute from "./attributeselector";

type ModalElement = 'component' | 'modal' | 'open' | 'close' | 'scroll' | 'sticky-top' | 'sticky-bottom';
type ModalAnimationType = 'fade' | 'slideUp' | 'custom' | 'none';

interface ModalAnimation {
  type: ModalAnimationType;
  duration: number;
  className?: string;
}

interface ModalSettings {
  id?: string;
  animation: ModalAnimation;
  stickyFooter: boolean;
  stickyHeader: boolean;
  lockBodyScroll: boolean;
}

interface ModalAttributes {
  id: string;
  element: string;
}

export const defaultModalAnimation: ModalAnimation = {
  type: 'none',
  duration: 0,
  className: 'is-closed'
}

export const defaultModalSettings: ModalSettings = {
  id: undefined,
  animation: defaultModalAnimation,
  stickyFooter: false,
  stickyHeader: false,
  lockBodyScroll: true,
}

export default class Modal {
  public component: HTMLElement;
  public modal: HTMLElement;
  public initialized: boolean = false;
  public settings: ModalSettings;
  public instance: string;
  public static attr: ModalAttributes = {
    id: 'data-modal-id',
    element: 'data-modal-element',
  };

  constructor(component: HTMLElement | null, settings: Partial<ModalSettings> = {}) {
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

  private static attributeSelector = createAttribute<ModalElement>(Modal.attr.element);

  /**
   * Static selector
   */
  public static selector(element: ModalElement, instance?: string): string {
    const base = Modal.attributeSelector(element);
    return instance
      ? `${base}[${Modal.attr.id}="${instance}"]`
      : base;
  }

  /**
   * Instance selector
   */
  public selector(element: ModalElement, local = true): string {
    return local
      ? Modal.selector(element, this.instance)
      : Modal.selector(element);
  }

  public static select<T extends Element = HTMLElement>(element: ModalElement, instance?: string): T {
    return document.querySelector<T>(Modal.selector(element, instance));
  }

  public static selectAll<T extends Element = HTMLElement>(element: ModalElement, instance?: string): NodeListOf<T> {
    return document.querySelectorAll<T>(Modal.selector(element, instance));
  }

  public select<T extends Element = HTMLElement>(element: ModalElement, local: boolean = true): T {
    return local
      ? this.component.querySelector<T>(Modal.selector(element))
      : document.querySelector<T>(Modal.selector(element, this.instance))
  }

  public selectAll<T extends Element = HTMLElement>(element: ModalElement, local: boolean = true): NodeListOf<T> {
    return local
      ? this.component.querySelectorAll<T>(Modal.selector(element))
      : document.querySelectorAll<T>(Modal.selector(element, this.instance))
  }

  private getModalElement(): HTMLElement {
    if (this.component.matches(Modal.selector('modal'))) {
      this.modal = this.component;
    } else {
      this.modal = this.component.querySelector(this.selector('modal'));
    }

    if (!this.modal) this.modal = this.component;

    return this.modal;
  }

  private setupStickyFooter(): void {
    const modalContent = this.component.querySelector<HTMLElement>(Modal.selector('scroll'));
    const stickyFooter = this.component.querySelector<HTMLElement>(Modal.selector('sticky-bottom'));

    if (!modalContent || !stickyFooter) {
      console.warn("Initialize modal: skip sticky footer");
    } else {
      this.setupScrollEvent(modalContent, stickyFooter);
    }
  }

  private setupScrollEvent(
    modalContent: HTMLElement,
    stickyFooter: HTMLElement
  ): void {
    modalContent.addEventListener("scroll", () => {
      const { scrollHeight, scrollTop, clientHeight } = modalContent;
      const isScrolledToBottom = scrollHeight - scrollTop <= clientHeight + 1;

      if (isScrolledToBottom) {
        // Remove scroll shadow
        stickyFooter.classList.remove("modal-scroll-shadow");
      } else {
        // If not scrolled to bottom, add scroll shadow
        stickyFooter.classList.add("modal-scroll-shadow");
      }
    });
  }

  private setInitialState(): void {
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

  private async show(): Promise<void> {
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

  private async hide(): Promise<void> {
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

    const finish = new Promise<void>(resolve => {
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
  public open() {
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
  public close() {
    if (this.settings.lockBodyScroll) {
      unlockBodyScroll();
    }
    this.hide();
  }
}

/**
 * Locks the scroll on the document body.
 *
 * This function sets the `overflow` style of the `body` element to `"hidden"`,
 * preventing the user from scrolling the page. Commonly used when displaying
 * modals, overlays, or other components that require the page to remain static.
 */
function lockBodyScroll(): void {
  document.body.style.overflow = "hidden";
}

/**
 * Unlocks the scroll on the document body.
 *
 * This function removes the `overflow` style from the `body` element,
 * allowing the user to scroll the page again. Typically used when hiding
 * modals, overlays, or other components that previously locked scrolling.
 */
function unlockBodyScroll(): void {
  document.body.style.removeProperty("overflow");
}

function animationFrame(): Promise<void> {
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
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key], source[key] as any);
    } else if (source[key] !== undefined) {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }

  return result;
}

