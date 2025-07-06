export interface DefaultScrollOptions {
    defaultOffset: number;
    defaultBehaviour: ScrollBehavior;
}
export interface OverrideScrollOptions {
    offset: number;
    behaviour: ScrollBehavior;
}
export declare const defaultScrollOptions: DefaultScrollOptions;
export declare function scrollToSection(id: string, selectorType?: "id" | "any", options?: Partial<OverrideScrollOptions>): void;
export declare function onScroll(link: HTMLAnchorElement, event: Event, options?: Partial<DefaultScrollOptions>): void;
export declare function initCMSScrollLinks(): void;
export declare function initGlobalScrollLinks(): void;
export declare function disableWebflowScroll(): void;
export declare function overrideDefaultScroll(options?: Partial<DefaultScrollOptions>): void;
export declare function overrideWebflowScroll(options?: Partial<DefaultScrollOptions>): void;
