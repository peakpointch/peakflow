import { Selector, type BaseAttributes } from "../attributeselector";

/**
 * Base class for components with attribute-based selectors
 */
export abstract class BaseComponent<Elements extends string> {
  static readonly attr: BaseAttributes = {
    id: "data-id",
    element: "data-element",
  };

  public component: HTMLElement;
  public instance: string;

  constructor(component: HTMLElement, instance?: string) {
    if (!component) throw new Error(`Component element cannot be null`);
    this.component = component;
    this.instance = instance || (this.constructor as typeof BaseComponent & { attr: any }).attr.id;
  }

  /**
   * Instance method: returns a selector string
   */
  public selector(element: Elements, local = true): string {
    const ctor = this.constructor as typeof BaseComponent & { attr: any; attributeSelector: any };
    return local ? ctor.selector(element, this.instance) : ctor.selector(element);
  }

  public select<T extends Element = HTMLElement>(element: Elements, local = true): T {
    const selector = this.selector(element, local);
    return (local ? this.component.querySelector(selector) : document.querySelector(selector)) as T;
  }

  public selectAll<T extends Element = HTMLElement>(
    element: Elements,
    local = true,
  ): NodeListOf<T> {
    const selector = this.selector(element, local);
    return (
      local ? this.component.querySelectorAll(selector) : document.querySelectorAll(selector)
    ) as NodeListOf<T>;
  }

  protected static attributeSelector = Selector.attr(this.attr.element);
  public static selector = Selector.instance(this.attributeSelector, this.attr);
  public static select = Selector.select(this.selector);
  public static selectAll = Selector.selectAll(this.selector);
}
