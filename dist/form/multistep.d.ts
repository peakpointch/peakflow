import { type FormProgressComponent, FieldGroup } from "./index.js";
import { type HTMLFormInput, type CustomValidator, FormProgressManager } from "./index.js";
import type { PartialDeep } from "type-fest";
import EventEmitter from "eventemitter3";
interface FormOptions {
    id: string;
    version: string;
    excludeInputSelectors: string[];
    recaptcha: boolean;
    validation: {
        validate: boolean;
        reportValidity: boolean;
    };
    manager: FormProgressManager;
    jsonFields: boolean;
}
interface MultiStepFormOptions extends FormOptions {
    navigation: {
        hideInStep: number;
    };
    pagination: {
        doneClass: string;
        activeClass: string;
    };
    onStepChange?: StepChangeCallback;
    nested: boolean;
}
type StepChangeCallback = (options: {
    index: number;
    currentStep: HTMLElement;
    targetStep: HTMLElement;
}) => void;
type CustomFormComponent = {
    stepIndex: number;
    instance: any;
    validator: CustomValidator;
    getData?: () => {};
};
type MultiStepFormEvents = "save" | "changeStep" | "submit" | "success" | "error" | "change" | "input";
type VirtualFieldFn<F = any, C = any> = (data: {
    fields: F;
    customFields: C;
}) => string;
export declare class MultiStepForm {
    static readonly defaultOptions: MultiStepFormOptions;
    id: string;
    version: string;
    options: MultiStepFormOptions;
    initialized: boolean;
    component: HTMLElement;
    events: EventEmitter<MultiStepFormEvents>;
    formElement: HTMLFormElement | HTMLElement;
    formSteps: NodeListOf<HTMLElement>;
    virtualFields: Map<string, string | VirtualFieldFn<any>>;
    private set currentStep(value);
    get currentStep(): number;
    private _currentStep;
    private navigationElement;
    private paginationItems;
    private buttonsNext;
    private buttonsPrev;
    private customComponents;
    private successElement;
    private errorElement;
    private submitButton;
    constructor(component: HTMLElement, options: PartialDeep<MultiStepFormOptions>);
    private validateComponent;
    private cacheDomElements;
    private setupForm;
    private setupEventListeners;
    addCustomComponent(component: CustomFormComponent): void;
    submit(): Promise<void>;
    private buildJsonForWebflow;
    private emitOnSuccess;
    private emitOnError;
    private initChangeStepOnKeydown;
    private initPagination;
    /**
     * Change to the next step.
     */
    changeToNext(): void;
    /**
     * Change to the previous step.
     */
    changeToPrevious(): void;
    /**
     * Change to the specified step by `index`.
     *
     * If moving forward, the method will validate all intermediate steps before
     * allowing navigation. If validation fails on any step, it will halt and move
     * to the invalid step instead.
     *
     * Use the CustomEvent "changeStep" to hook into step changes.
     *
     * @param index - The zero-based index of the step to navigate to.
     */
    changeToStep(index: number): void;
    private updateStepVisibility;
    set onChangeStep(callback: StepChangeCallback);
    private updatePagination;
    validateAllSteps(): boolean;
    validateCurrentStep(stepIndex: number): boolean;
    getFormInputs(step?: number): HTMLFormInput[];
    /**
     * Gets data of all form fields in a `FieldGroup`.
     *
     * @step Step index of the multi step form
     * @returns A `FieldGroup`
     *
     * Fields that are a descendant of '[data-steps-element="custom-component"]' are excluded.
     */
    getFieldGroup(step?: number): FieldGroup;
    getFormData(): any;
    getFormInput<T extends HTMLFormInput = HTMLFormInput>(id: string): T;
    loadProgress(): void;
    saveFields(): void;
    saveComponentProgress(component: FormProgressComponent): void;
    onSave(callback: (...args: any[]) => void): void;
    clearOnSave(): void;
}
export {};
