import type { LogLevel, LogLevelNames } from "loglevel";
import Logger from "../logger/index.js";
import {
  Selector,
  type AttributeAccessorMap,
  type AttributeSelector,
  type BaseAttributes,
  type InstanceDefaultOptions,
  type InstanceSelector,
  type SelectOptions,
} from "../selector/index.js";
import { mergeOptions } from "../utils/index.js";
import type { PartialOptions } from "../typeutils/index.js";

type ComponentConstructor = abstract new (...args: any[]) => BaseComponent<any, any>;

type ElementsOf<T extends ComponentConstructor> =
  InstanceType<T> extends BaseComponent<infer Elements, any> ? Elements : never;

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
  static readonly attr: AttributeAccessorMap<BaseAttributes> = {
    id: "data-id",
    element: "data-element",
  };

  public readonly component: HTMLElement;
  public readonly id: string;
  public logger: Logger;
  public settings: Settings;

  constructor(component: HTMLElement, settings?: PartialOptions<Settings>) {
    if (!component) throw new Error(`Component element cannot be null`);
    const SubClass = this.constructor as typeof BaseComponent;
    this.component = component;
    this.settings = mergeOptions(SubClass.defaultSettings, settings) as Settings;
    this.id = this.settings.id || component.getAttribute(SubClass.attr.id);
  }

  public selector(element: Elements, global: boolean = false): string {
    const SubClass = this.constructor as typeof BaseComponent;
    return global ? SubClass.selector(element, this.id) : SubClass.selector(element);
  }

  public select<T extends Element = HTMLElement>(element: Elements, global: boolean = false): T {
    const selector = this.selector(element, global);
    return (
      global ? document.querySelector(selector) : this.component.querySelector(selector)
    ) as T;
  }

  public selectAll<T extends Element = HTMLElement>(
    element: Elements,
    global: boolean = false,
  ): NodeListOf<T> {
    const selector = this.selector(element, global);
    return (
      global ? document.querySelectorAll(selector) : this.component.querySelectorAll(selector)
    ) as NodeListOf<T>;
  }

  public enableLogging(level?: LogLevelNames): void {
    if (!this.logger) {
      const className = this.constructor.name.replace("_", "");
      this.logger = new Logger(className, level);
      this.logger.instance = this.id;
    } else {
      this.logger.setLevel(level);
    }
  }

  protected static attributeSelector: AttributeSelector<any> = Selector.attr(function (
    this: typeof BaseComponent,
  ) {
    return this.attr.element;
  });

  public static selector: InstanceSelector<any> = Selector.instance(
    this.attributeSelector,
    function (this: typeof BaseComponent) {
      return this.attr;
    },
  );

  public static select = Selector.select<any>(this.selector);
  public static selectAll = Selector.selectAll<any>(this.selector);
}
