type CMSSelectElement = 'source' | 'target' | 'option';
interface CMSSelectAttr {
    element: string;
    prefix: string;
    value: string;
    status: string;
    wait: string;
}
export default class CMSSelect {
    name: string;
    source: HTMLElement;
    targets: HTMLSelectElement[];
    values: string[];
    waitEvent: string;
    attr: CMSSelectAttr;
    constructor(component: string | HTMLElement);
    static selector: import("../attributeselector").AttributeSelector<CMSSelectElement>;
    private selector;
    static initializeAll(): void;
    static createOption(value: string): HTMLOptionElement;
    /**
     * @param graceful Whether to throw an error if the wait event is invalid.
     * @returns A boolean indicating whether the wait event was initialized successfully.
     */
    initWaitEvent(graceful?: boolean): boolean;
    readValues(): void;
    private insertSelectOptions;
    getSelectValue(item: HTMLElement): string;
}
export {};
