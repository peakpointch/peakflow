import { BaseComponent, type BaseSettings } from "../base-component";
import type { PartialDeep } from "type-fest";
export type ToggleElement = "component" | "checkbox" | "toggle";
export interface ToggleSettings extends BaseSettings {
    colors: {
        active: string;
        inactive: string;
        activeToggle: string;
        inactiveToggle: string;
    };
}
export declare class Toggle extends BaseComponent<ToggleElement, ToggleSettings> {
    static readonly defaultSettings: ToggleSettings;
    static readonly attr: {
        id: string;
        element: string;
    };
    checkbox: HTMLInputElement;
    toggle: HTMLElement;
    constructor(checkbox: HTMLInputElement, options?: PartialDeep<ToggleSettings>);
    protected static attributeSelector: import("../selector").AttributeSelector<ToggleElement>;
    static selector: import("../selector").InstanceSelector<ToggleElement>;
    static select: <U extends Element = HTMLElement>(element: ToggleElement, instance?: string, options?: import("../selector").SelectOptions) => U;
    static selectAll: <U extends Element = HTMLElement>(element: ToggleElement, instance?: string, options?: import("../selector").SelectOptions) => NodeListOf<U>;
    private initEventListeners;
    private updateToggleState;
    static initAll(container?: HTMLElement | Document, settings?: PartialDeep<Omit<ToggleSettings, "id">>): void;
}
