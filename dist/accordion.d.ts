export default class Accordion {
    component: HTMLElement;
    trigger: HTMLElement;
    uiTrigger: HTMLElement;
    isOpen: boolean;
    private icon;
    constructor(component: HTMLElement);
    open(): void;
    close(): void;
    toggle(): void;
    scrollIntoView(): void;
}
