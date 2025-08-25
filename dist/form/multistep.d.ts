import type { FormFieldMap, HTMLFormInput, CustomValidator } from "./index.js";
interface FormOptions {
    excludeInputSelectors: string[];
    recaptcha: boolean;
    validation: {
        validate: boolean;
        reportValidity: boolean;
    };
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
export declare class MultiStepForm {
    options: MultiStepFormOptions;
    initialized: boolean;
    component: HTMLElement;
    formElement: HTMLFormElement | HTMLElement;
    formSteps: NodeListOf<HTMLElement>;
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
    constructor(component: HTMLElement, options: Partial<MultiStepFormOptions>);
    private validateComponent;
    private cacheDomElements;
    private setupForm;
    private setupEventListeners;
    addCustomComponent(component: CustomFormComponent): void;
    private submitToWebflow;
    private buildJsonForWebflow;
    private onFormSuccess;
    private onFormError;
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
    /**
     * Gets data of all form fields in a `FormFieldMap`.
     *
     * @step Step index of the multi step form
     * @returns `FormFieldMap` - A map of field id (string) to a `FormField` class instance
     *
     * Fields that are a descendant of '[data-steps-element="custom-component"]' are excluded.
     */
    getFieldMapForStep(step: number): FormFieldMap;
    getFieldMap(): FormFieldMap;
    getFormData(): any;
    getFormInput<T extends HTMLFormInput = HTMLFormInput>(id: string): T;
}
export {};
