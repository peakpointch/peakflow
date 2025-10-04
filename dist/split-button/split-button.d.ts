type SplitButtonElement = "component" | "button" | "trigger" | "list" | "option";
interface SplitButtonAttributes {
    id: string;
    element: string;
    key: string;
    label: string;
}
export type ButtonAction = {
    label: string;
    element: HTMLElement;
    handler: () => void;
};
interface SplitButtonSettings {
    id?: string;
    hideSelectedAction: boolean;
}
export declare class SplitButton<ActionKey extends string = string> {
    static get attr(): SplitButtonAttributes;
    static get defaultSettings(): SplitButtonSettings;
    instance: string;
    settings: SplitButtonSettings;
    private component;
    private button;
    private actions;
    private currentActionKey;
    private renderButtonContent;
    constructor(component: HTMLElement, settings?: Partial<SplitButtonSettings>);
    private static attributeSelector;
    /**
     * Static selector
     */
    static selector(element: SplitButtonElement, instance?: string): string;
    /**
     * Instance selector
     */
    selector(element: SplitButtonElement, local?: boolean): string;
    static select<T extends Element = HTMLElement>(element: SplitButtonElement, instance?: string): T | null;
    static selectAll<T extends Element = HTMLElement>(element: SplitButtonElement, instance?: string): NodeListOf<T>;
    select<T extends Element = HTMLElement>(element: SplitButtonElement, local?: boolean): T;
    selectAll<T extends Element = HTMLElement>(element: SplitButtonElement, local?: boolean): NodeListOf<T>;
    setRenderButtonContent(renderer: (action: ButtonAction) => void): void;
    setAction(key: ActionKey): void;
    setActionHandler(key: ActionKey, handler: () => void): void;
    executeAction(): void;
    showAllActionElements(): void;
}
export {};
