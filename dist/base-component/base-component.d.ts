import { type BaseAttributes } from "../attributeselector";
import type { PartialDeep } from "type-fest";
export interface BaseSettings {
    id: string;
}
/**
 * Base class for components with attribute-based selectors
 */
export declare abstract class BaseComponent<Elements extends string, Settings extends BaseSettings = BaseSettings> {
    static readonly defaultSettings: BaseSettings;
    static readonly attr: BaseAttributes;
    readonly component: HTMLElement;
    readonly id: string;
    settings: Settings;
    constructor(component: HTMLElement, settings?: PartialDeep<Settings>);
    selector(element: Elements, global?: boolean): string;
    select<T extends Element = HTMLElement>(element: Elements, global?: boolean): T;
    selectAll<T extends Element = HTMLElement>(element: Elements, global?: boolean): NodeListOf<T>;
    protected static get attributeSelector(): import("../attributeselector").AttributeSelector<string>;
    static get selector(): import("../attributeselector").InstanceSelector<string>;
    static get select(): <U extends Element = HTMLElement>(element: string, instance?: string) => U;
    static get selectAll(): <U extends Element = HTMLElement>(element: string, instance?: string) => NodeListOf<U>;
}
