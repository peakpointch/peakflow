import createAttribute from "./attributeselector";
import deepMerge from "./deepmerge";
import {
  adjustPaddingForScrollbar,
  isScrollbarVisible,
  lockBodyScroll,
  resetScrollbarPadding,
  unlockBodyScroll
} from "./scroll/lock";
import { ClearTimeoutFunction, createScrollTo, ScrollToFunction } from "./scroll/scrollto";

type ModalElement = 'component' | 'modal' | 'open' | 'close' | 'cancel' | 'confirm' | 'scroll' | 'sticky-top' | 'sticky-bottom';
type ModalAnimationType = 'fade' | 'slideUp' | 'growIn' | 'custom' | 'none';

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
  bodyScroll: {
    lock: boolean;
    smooth?: boolean;
  };
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
  bodyScroll: {
    lock: true,
    smooth: false,
  },
}

export default class Modal {
  public component: HTMLElement;
  public modal: HTMLElement;
  public opened: boolean;
  public initialized: boolean = false;
  public settings: ModalSettings;
  public instance: string;
  public static attr: ModalAttributes = {
    id: 'data-modal-id',
    element: 'data-modal-element',
  };
  public scrollTo: ScrollToFunction;
  public clearScrollTimeout: ClearTimeoutFunction;

  constructor(component: HTMLElement | null, settings: Partial<ModalSettings> = {}) {
    if (!component) {
      throw new Error(`The component HTMLElement cannot be undefined.`);
    }
    this.component = component;
    this.settings = deepMerge(defaultModalSettings, settings);
    this.modal = this.getModalElement();
    this.instance = this.settings.id || component.getAttribute(Modal.attr.id);
    component.setAttribute(Modal.attr.id, this.instance);

    // accessibility
    this.component.setAttribute('role', 'dialog');
    this.component.setAttribute('aria-modal', 'true');

    this.setupScrollTo();
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

  public setupScrollTo(): void {
    const scrollHandler = createScrollTo({
      scrollWrapper: this.modal,
      stickyTop: this.select('sticky-top'),
      stickyBottom: this.select('sticky-bottom')
    });

    this.scrollTo = scrollHandler.scrollTo;
    this.clearScrollTimeout = scrollHandler.clearScrollTimeout;
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
      case 'growIn':
      case 'slideUp':
        this.modal.style.willChange = 'transform';
        this.modal.style.transitionProperty = 'transform';
        this.modal.style.transitionDuration = `${this.settings.animation.duration.toString()}ms`;

      case 'fade':
        this.component.style.willChange = 'opacity';
        this.component.style.transitionProperty = 'opacity';
        this.component.style.transitionDuration = `${this.settings.animation.duration.toString()}ms`;
        break;

      case 'none':
        break;
    }

    this.component.dataset.state = "closed";
  }

  private async show(): Promise<void> {
    this.component.style.removeProperty('display');

    await animationFrame();

    switch (this.settings.animation.type) {
      case 'fade':
        this.component.style.opacity = '1';
        break;

      case 'slideUp':
        this.component.style.opacity = '1';
        this.modal.style.transform = 'translateY(0vh)';
        break;

      case 'growIn':
        this.component.style.opacity = '1';
        this.modal.style.transform = 'scale(1)';
        break;

      default:
        this.component.classList.remove("is-closed");
    }

    setTimeout(() => {
    }, this.settings.animation.duration);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, this.settings.animation.duration);
    });
  }

  private async hide(): Promise<void> {
    await animationFrame();

    switch (this.settings.animation.type) {
      case 'fade':
        this.component.style.opacity = '0';
        break;

      case 'slideUp':
        this.component.style.opacity = '0';
        this.modal.style.transform = 'translateY(10vh)';
        break;

      case 'growIn':
        this.component.style.opacity = '0';
        this.modal.style.transform = 'scale(0.9)';
        break;

      default:
        break;
    }

    return new Promise<void>(resolve => {
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
  public async open() {
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
  public async close() {
    this.component.dataset.state = "closing";
    if (this.settings.bodyScroll.lock) {
      resetScrollbarPadding(this.component);
      unlockBodyScroll(this.settings.bodyScroll.smooth);
    }
    await this.hide();
    this.opened = false;
    this.component.dataset.state = "closed";
  }
}

function animationFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}
