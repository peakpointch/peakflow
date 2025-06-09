export type ScrollPosition = "start" | "center" | "end" | "nearest";
interface ScrollToOptions extends ScrollOptions {
    delay: number;
    offset: number;
    position: ScrollPosition;
}
interface ScrollHandlerConfig {
    scrollWrapper: HTMLElement;
    stickyTop?: HTMLElement | null;
    stickyBottom?: HTMLElement | null;
}
export declare class ScrollHandler {
    private scrollWrapper;
    private stickyTop?;
    private stickyBottom?;
    private scrollTimeoutId;
    constructor(config: ScrollHandlerConfig);
    clearScrollTimeout(): void;
    scrollTo(element: HTMLElement, options?: Partial<ScrollToOptions>): Promise<void>;
}
export {};
