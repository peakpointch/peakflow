export type ScrollPosition = "start" | "center" | "end" | "nearest";
interface OwnScrollToOptions {
    delay: number;
    offset: number;
    position: ScrollPosition;
}
interface CreateScrollToConfig {
    scrollWrapper: HTMLElement;
    stickyTop?: HTMLElement | null;
    stickyBottom?: HTMLElement | null;
}
export type ScrollToFunction = (element: HTMLElement, options: Partial<OwnScrollToOptions>) => Promise<void>;
export type ClearTimeoutFunction = () => void;
export declare function createScrollTo(config: CreateScrollToConfig): {
    scrollTo: ScrollToFunction;
    clearScrollTimeout: ClearTimeoutFunction;
};
export {};
