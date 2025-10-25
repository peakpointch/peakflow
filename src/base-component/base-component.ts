import { Selector, type BaseAttributes } from "../attributeselector";
import { deepMerge } from "../utils";
import type { PartialDeep } from "type-fest";

export interface BaseSettings {
  id: string;
}

/**
 * Base class for components with attribute-based selectors
 */
export abstract class BaseComponent<
  Elements extends string,
  Settings extends BaseSettings = BaseSettings,
> {
  static readonly defaultSettings: BaseSettings = {
    id: undefined,
  };
  static readonly attr: BaseAttributes = {
    id: "data-id",
    element: "data-element",
  };

  public component: HTMLElement;
  public id: string;
  public settings: Settings;

  constructor(component: HTMLElement, settings?: PartialDeep<Settings>) {
    if (!component) throw new Error(`Component element cannot be null`);
    const SubClass = this.constructor as typeof BaseComponent;
    this.component = component;
    this.settings = deepMerge(SubClass.defaultSettings, settings) as Settings;
    this.id = this.settings.id || component.getAttribute(SubClass.attr.id);
  }

  /**
   * Instance method: returns a selector string
   */
  public selector(element: Elements, local = true): string {
    const ctor = this.constructor as typeof BaseComponent & { attr: any; attributeSelector: any };
    return local ? ctor.selector(element, this.id) : ctor.selector(element);
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
