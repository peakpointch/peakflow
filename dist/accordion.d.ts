export default class Accordion {
    component: HTMLElement;
    uiTrigger: HTMLElement;
    isOpen: boolean;
    private trigger;
    private icon;
    private onClickCallback;
    constructor(component: HTMLElement);
    onClick(callback: () => void): void;
    removeOnClick(): void;
    open(): void;
    close(): void;
    toggle(): void;
    scrollIntoView(scrollWrapper: HTMLElement, offset?: number): void;
}
