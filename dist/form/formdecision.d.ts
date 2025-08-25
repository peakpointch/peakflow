interface FormDecisionAttributes {
    component: string;
    element: string;
    pathId: string;
    required: string;
}
export type FormDecisionElement = "component" | "decision" | "input" | "path";
type DecisionPathMap<PathId extends string = string> = Map<PathId, HTMLElement>;
interface FormDecisionOptions<PathId> {
    id: string;
    clearPathOnChange: boolean;
    defaultPath: PathId | null;
}
/**
 * Represents a decision component within a form, managing conditional paths based on user input.
 *
 * ### Required DOM Structure
 * - **Component Wrapper**: Root element with `data-decision-component`.
 * - **Decision Inputs**: Inputs inside `data-decision-element="decision"`, with `data-decision-action` matching the paths they control.
 * - **Paths**: Elements with `data-decision-path` matching the inputs' `data-decision-action` values.
 * - **HTML Example:**
 *   ```html
 *   <div data-decision-component="example">
 *     <div data-decision-element="decision">
 *       <input type="radio" data-decision-element="input" data-path-id="path1">
 *       <input type="radio" data-decision-element="input" data-path-id="path2">
 *     </div>
 *     <div data-decision-element="path" data-path-id="path1"></div>
 *     <div data-decision-element="path" data-path-id="path2"></div>
 *   </div>
 *   ```
 */
export declare class FormDecision<PathId extends string = string> {
    opts: FormDecisionOptions<PathId>;
    component: HTMLElement;
    paths: DecisionPathMap<PathId>;
    private formMessage;
    private decisionInputs;
    private errorMessages;
    private defaultErrorMessage;
    private onChangeCallback;
    private attr;
    static get attr(): FormDecisionAttributes;
    private _currentPath;
    get currentPath(): PathId;
    private set currentPath(value);
    /**
     * Constructs a new FormDecision instance.
     * @param component The FormDecision element.
     * @param id Unique identifier for the specific instance.
     */
    constructor(component: HTMLElement | null, options: Partial<FormDecisionOptions<PathId>>);
    static selector: import("../attributeselector/attributeselector.js").AttributeSelector<FormDecisionElement>;
    selector: import("../attributeselector/attributeselector.js").AttributeSelector<FormDecisionElement>;
    /**
     * Initializes the FormDecision instance by setting up decision inputs & paths as well as their event listeners.
     */
    private initialize;
    /**
     * Handles changes to the decision input fields and updates the associated path visibility.
     * @param path The HTMLElement that contains the form fields of this path.
     * @param event The event that invokes this change.
     */
    changeToPath(pathId: PathId | null, event?: Event): void;
    reset(force?: PathId | null): void;
    /**
     * Sync the path shown do the actual selected path, if the component ever gets out of sync.
     */
    sync(): void;
    /**
     * Sets the display of all path elements to 'none'.
     */
    private hideAllPaths;
    /**
     * Retrieves the currently selected decision input.
     * @returns The selected input element, or undefined if none is selected.
     */
    getSelectedInput(): HTMLInputElement | undefined;
    /**
     * Retrieves the current `PathId` from the currently selected decision input.
     */
    private getCurrentPath;
    /**
     * Validates the FormDecision based on the selected path to ensure the form's correctness.
     * @returns A boolean indicating whether the validation passed.
     */
    validate(): boolean;
    /**
     * Sets custom error messages for the decision inputs.
     * @param messages An object mapping decision input values to error messages.
     * @param defaultMessage An optional default error message to use when no specific message is provided.
     */
    setErrorMessages(messages: {
        [key: string]: string;
    }, defaultMessage?: string): void;
    /**
     * Validates the fields within the specified path and returns whether they are valid.
     * @param pathIndex The index of the path to validate.
     * @returns A boolean indicating whether the specified path is valid.
     */
    private checkPathValidity;
    private initRequiredAttributes;
    /**
     * Updates the required attributes of input fields within the paths based on the selected decision input.
     */
    private updateRequiredAttributes;
    clearPath(pathId: PathId, silent?: boolean): void;
    clearAllPaths(clearCurrentPath?: boolean): void;
    /**
     * Displays validation message based on the current path.
     * @param currentGroupValid A boolean indicating whether the current group of inputs is valid.
     */
    private handleValidationMessages;
    onChange(callback: () => void): void;
    clearOnChange(): void;
}
export {};
