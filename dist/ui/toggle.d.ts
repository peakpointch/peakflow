import { BaseComponent, type BaseSettings } from "../base-component";
import type { PartialOptions } from "../typeutils/index.js";
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
    constructor(checkbox: HTMLInputElement, options?: PartialOptions<ToggleSettings>);
    protected static readonly attributeSelector: import("..").AttributeSelector<ToggleElement>;
    static readonly selector: import("..").InstanceSelector<ToggleElement>;
    static readonly select: <U extends Element = HTMLElement>(this: unknown, element: ToggleElement, instance?: string, options?: import("..").SelectOptions) => U;
    static readonly selectAll: <U extends Element = HTMLElement>(this: unknown, element: ToggleElement, instance?: string, options?: import("..").SelectOptions) => NodeListOf<U>;
    private initEventListeners;
    private updateToggleState;
    static initAll(container?: HTMLElement | Document, settings?: PartialOptions<Omit<ToggleSettings, "id">>): void;
}
