type CMSSelectElement = 'source' | 'target' | 'option';
type OnChangeCallback = () => void;
interface CMSSelectAttr {
    id: string;
    element: string;
    prefix: string;
    value: string;
    status: string;
    wait: string;
}
interface CMSSelectOptions {
    id: string;
}
export default class CMSSelect {
    opts: CMSSelectOptions;
    id: string;
    source: HTMLElement;
    targets: HTMLSelectElement[];
    values: string[];
    waitEvent: string;
    static attr: CMSSelectAttr;
    attr: CMSSelectAttr;
    private onChangeCallbacks;
    constructor(component: string | HTMLElement, options?: Partial<CMSSelectOptions>);
    private static attributeSelector;
    /**
     * Static selector
     */
    static selector(element: CMSSelectElement, instance?: string): string;
    /**
     * Instance selector
     */
    selector(element: CMSSelectElement, local?: boolean): string;
    static initializeAll(): void;
    static createOption(value: string): HTMLOptionElement;
    static insertOptions(targets: HTMLSelectElement[], values: string[]): void;
    static clearOptions(targets: HTMLSelectElement | HTMLSelectElement[], keepEmpty: boolean): void;
    /**
     * @param graceful Whether to throw an error if the wait event is invalid.
     * @returns A boolean indicating whether the wait event was initialized successfully.
     */
    initWaitEvent(graceful?: boolean): boolean;
    readValues(): void;
    insertOptions(): void;
    getSelectValue(item: HTMLElement): string;
    private initOnChange;
    onChange(name: string, callback: OnChangeCallback): void;
    clearOnChange(name: string): void;
    triggerOnChange(): void;
}
export {};
