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
    component: HTMLElement;
    id: string;
    settings: Settings;
    constructor(component: HTMLElement, settings?: PartialDeep<Settings>);
    /**
     * Instance method: returns a selector string
     */
    selector(element: Elements, local?: boolean): string;
    select<T extends Element = HTMLElement>(element: Elements, local?: boolean): T;
    selectAll<T extends Element = HTMLElement>(element: Elements, local?: boolean): NodeListOf<T>;
    protected static attributeSelector: import("../attributeselector").AttributeSelector<string>;
    static selector: import("../attributeselector").InstanceSelector<string>;
    static select: <U extends Element = HTMLElement>(element: string, instance?: string) => U;
    static selectAll: <U extends Element = HTMLElement>(element: string, instance?: string) => NodeListOf<U>;
}
