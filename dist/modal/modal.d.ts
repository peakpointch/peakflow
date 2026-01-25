import type { PartialDeep } from "type-fest";
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
interface ModalAttributes {
    id: string;
    element: string;
}
export declare class Modal extends BaseComponent<ModalElement> {
    static readonly defaultSettings: ModalSettings;
    component: HTMLElement;
    modal: HTMLElement;
    opened: boolean;
    initialized: boolean;
    settings: ModalSettings;
    id: string;
    static attr: ModalAttributes;
    scrollHandler: ScrollHandler;
    scrollTo: ScrollHandler["scrollTo"];
    clearScrollTimeout: ScrollHandler["clearScrollTimeout"];
    constructor(component: HTMLElement | null, settings?: PartialDeep<ModalSettings>);
    protected static attributeSelector: import("../selector/selector.js").AttributeSelector<ModalElement>;
    static selector: import("../selector/selector.js").InstanceSelector<ModalElement>;
    static select: <U extends Element = HTMLElement>(element: ModalElement, instance?: string) => U;
    static selectAll: <U extends Element = HTMLElement>(element: ModalElement, instance?: string) => NodeListOf<U>;
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
