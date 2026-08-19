type CopyComponentElement = "component" | "button";
export declare class CopyComponent {
    trigger: HTMLButtonElement;
    data: string;
    private config;
    static readonly attr: {
        component: string;
        element: string;
        data: string;
    };
    constructor(trigger: HTMLButtonElement, data: string | number);
    static selector: import("../selector/selector.js").AttributeSelector<CopyComponentElement>;
    static create(component: HTMLElement): CopyComponent;
    private initEventListener;
}
export declare function initCopyComponents(): void;
export {};
