import { BaseComponent, type BaseSettings } from "../base-component";
import type { PartialDeep } from "type-fest";
export type CursorElement = "pointer";
export type CursorState = "base" | "hover";
export type CursorTheme = Record<CursorState, gsap.TweenVars>;
export interface CursorSettings<Theme extends string = string> extends BaseSettings {
    defaultTheme: Theme;
    themes: Record<Theme, CursorTheme>;
    selectors: {
        hover: string;
        click: string;
    };
    style: gsap.CSSVars;
    breakpoints: Record<number, gsap.CSSVars>;
    mobileFirst: boolean;
}
export declare class Cursor<T extends string> extends BaseComponent<CursorElement, CursorSettings> {
    static readonly defaultSettings: CursorSettings;
    static readonly attr: {
        id: string;
        element: string;
    };
    readonly attr: {
        id: string;
        element: string;
    };
    currentTheme: T;
    cursors: HTMLElement[];
    settings: CursorSettings<T>;
    constructor(cursor: HTMLElement, settings?: PartialDeep<CursorSettings<T>>);
    protected static attributeSelector: import("..").AttributeSelector<"pointer">;
    static selector: import("..").InstanceSelector<"pointer">;
    static select: <U extends Element = HTMLElement>(element: "pointer", instance?: string, options?: import("..").SelectOptions) => U;
    static selectAll: <U extends Element = HTMLElement>(element: "pointer", instance?: string, options?: import("..").SelectOptions) => NodeListOf<U>;
    static create<T extends string>(settings: PartialDeep<CursorSettings<T>>): Cursor<T>;
    addPointer(pointer: HTMLElement): void;
    addTail(pointer: HTMLElement, vars: gsap.TweenVars): void;
    applyState(state: CursorState, override?: gsap.TweenVars): void;
    private initTheme;
    private initHover;
    private injectStyles;
}
