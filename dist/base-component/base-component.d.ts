import type { LogLevelNames } from "loglevel";
import Logger from "../logger/index.js";
import { type AttributeAccessorMap, type AttributeSelector, type BaseAttributes, type InstanceSelector, type SelectOptions } from "../selector/index.js";
import type { PartialOptions } from "../typeutils/index.js";
export interface BaseSettings {
    id: string;
}
/**
 * Base class for components with attribute-based selectors
 */
export declare abstract class BaseComponent<Elements extends string, Settings extends BaseSettings = BaseSettings> {
    static readonly defaultSettings: BaseSettings;
    static readonly attr: AttributeAccessorMap<BaseAttributes>;
    readonly component: HTMLElement;
    readonly id: string;
    logger: Logger;
    settings: Settings;
    constructor(component: HTMLElement, settings?: PartialOptions<Settings>);
    selector(element: Elements, global?: boolean): string;
    select<T extends Element = HTMLElement>(element: Elements, global?: boolean): T;
    selectAll<T extends Element = HTMLElement>(element: Elements, global?: boolean): NodeListOf<T>;
    enableLogging(level?: LogLevelNames): void;
    protected static attributeSelector: AttributeSelector<any>;
    static selector: InstanceSelector<any>;
    static select: <U extends Element = HTMLElement>(this: unknown, element: any, instance?: string, options?: SelectOptions) => U;
    static selectAll: <U extends Element = HTMLElement>(this: unknown, element: any, instance?: string, options?: SelectOptions) => NodeListOf<U>;
}
