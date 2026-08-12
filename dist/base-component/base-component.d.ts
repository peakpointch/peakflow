import type { LogLevelNames } from "loglevel";
import Logger from "../logger/";
import { type AttributeAccessorMap, type BaseAttributes } from "../selector";
import type { PartialDeep } from "type-fest";
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
    constructor(component: HTMLElement, settings?: PartialDeep<Settings>);
    selector(element: Elements, global?: boolean): string;
    select<T extends Element = HTMLElement>(element: Elements, global?: boolean): T;
    selectAll<T extends Element = HTMLElement>(element: Elements, global?: boolean): NodeListOf<T>;
    enableLogging(level?: LogLevelNames): void;
    protected static get attributeSelector(): import("..").AttributeSelector<string>;
    static get selector(): import("..").InstanceSelector<string>;
    static get select(): <U extends Element = HTMLElement>(element: string, instance?: string, options?: import("..").SelectOptions) => U;
    static get selectAll(): <U extends Element = HTMLElement>(element: string, instance?: string, options?: import("..").SelectOptions) => NodeListOf<U>;
}
