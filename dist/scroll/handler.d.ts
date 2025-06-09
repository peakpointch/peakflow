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
export declare class ScrollHandler {
    private scrollWrapper;
    private stickyTop?;
    private stickyBottom?;
    private scrollTimeoutId;
    constructor(config: CreateScrollToConfig);
    clearScrollTimeout(): void;
    scrollTo(element: HTMLElement, options?: Partial<OwnScrollToOptions>): Promise<void>;
}
export {};
