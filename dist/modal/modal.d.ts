import type { PartialOptions } from "../typeutils/index.js";
import { type AttributeAccessorMap, type BaseAttributes } from "../selector/index.js";
import { ScrollHandler } from "../scroll/index.js";
import { BaseComponent, type BaseSettings } from "../base-component/index.js";
type ModalElement = "component" | "modal" | "open" | "close" | "cancel" | "confirm" | "scroll" | "sticky-top" | "sticky-bottom";
type ModalAnimationType = "fade" | "slideUp" | "growIn" | "custom" | "none";
interface ModalAnimation {
    type: ModalAnimationType;
    duration: number;
    className?: string;
}
interface ModalSettings extends BaseSettings {
    animation: ModalAnimation;
    stickyFooter: boolean;
    stickyHeader: boolean;
    bodyScroll: {
        lock: boolean;
        smooth?: boolean;
    };
}
interface ModalAttributes extends BaseAttributes {
    id: string;
    element: string;
}
export declare class Modal extends BaseComponent<ModalElement> {
    static attr: AttributeAccessorMap<ModalAttributes>;
    static readonly defaultSettings: ModalSettings;
    component: HTMLElement;
    modal: HTMLElement;
    opened: boolean;
    initialized: boolean;
    settings: ModalSettings;
    id: string;
    scrollHandler: ScrollHandler;
    scrollTo: ScrollHandler["scrollTo"];
    clearScrollTimeout: ScrollHandler["clearScrollTimeout"];
    constructor(component: HTMLElement | null, settings?: PartialOptions<ModalSettings>);
    protected static readonly attributeSelector: import("../index.js").AttributeSelector<ModalElement>;
    static readonly selector: import("../index.js").InstanceSelector<ModalElement>;
    static readonly select: <U extends Element = HTMLElement>(this: unknown, element: ModalElement, instance?: string, options?: import("../index.js").SelectOptions) => U;
    static readonly selectAll: <U extends Element = HTMLElement>(this: unknown, element: ModalElement, instance?: string, options?: import("../index.js").SelectOptions) => NodeListOf<U>;
    private getModalElement;
    setupScrollTo(): void;
    private setupStickyFooter;
    private setupScrollEvent;
    private setInitialState;
    private show;
    private hide;
    /**
     * Opens the modal instance.
     *
     * This method calls the `show` method and locks the scroll of the document body.
     */
    open(): Promise<void>;
    /**
     * Closes the modal instance.
     *
     * This method calls the `hide` method and unlocks the scroll of the document body.
     */
    close(): Promise<void>;
}
export {};
