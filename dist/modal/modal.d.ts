import { ScrollHandler } from "../scroll/index.js";
type ModalElement = 'component' | 'modal' | 'open' | 'close' | 'cancel' | 'confirm' | 'scroll' | 'sticky-top' | 'sticky-bottom';
type ModalAnimationType = 'fade' | 'slideUp' | 'growIn' | 'custom' | 'none';
interface ModalAnimation {
    type: ModalAnimationType;
    duration: number;
    className?: string;
}
interface ModalSettings {
    id?: string;
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
export declare const defaultModalAnimation: ModalAnimation;
export declare const defaultModalSettings: ModalSettings;
export declare class Modal {
    component: HTMLElement;
    modal: HTMLElement;
    opened: boolean;
    initialized: boolean;
    settings: ModalSettings;
    instance: string;
    static attr: ModalAttributes;
    scrollHandler: ScrollHandler;
    scrollTo: ScrollHandler["scrollTo"];
    clearScrollTimeout: ScrollHandler["clearScrollTimeout"];
    constructor(component: HTMLElement | null, settings?: Partial<ModalSettings>);
    private static attributeSelector;
    /**
     * Static selector
     */
    static selector(element: ModalElement, instance?: string): string;
    /**
     * Instance selector
     */
    selector(element: ModalElement, local?: boolean): string;
    static select<T extends Element = HTMLElement>(element: ModalElement, instance?: string): T;
    static selectAll<T extends Element = HTMLElement>(element: ModalElement, instance?: string): NodeListOf<T>;
    select<T extends Element = HTMLElement>(element: ModalElement, local?: boolean): T;
    selectAll<T extends Element = HTMLElement>(element: ModalElement, local?: boolean): NodeListOf<T>;
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
