export declare class Script {
    element: HTMLScriptElement;
    constructor(src: string);
    addAttribute(name: string, value: string): void;
}
export declare class Stylesheet {
    element: HTMLLinkElement;
    constructor(href: string);
    addAttribute(name: string, value: string): void;
}
