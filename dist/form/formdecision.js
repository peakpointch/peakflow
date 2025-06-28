import wf from "../webflow/index.js";
import { setChecked, validateFields } from "./utility.js";
import { FormMessage } from "./formmessage.js";
import createAttribute from "../attributeselector/index.js";
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
export class FormDecision {
    static get attr() {
        return {
            component: 'data-decision-component',
            element: 'data-decision-element',
            pathId: 'data-path-id',
            required: 'data-decision-required',
        };
    }
    get currentPath() {
        return this._currentPath;
    }
    set currentPath(pathId) {
        this._currentPath = pathId;
    }
    /**
     * Constructs a new FormDecision instance.
     * @param component The FormDecision element.
     * @param id Unique identifier for the specific instance.
     */
    constructor(component, options) {
        this.opts = {
            id: undefined,
            clearPathOnChange: false,
            defaultPath: null,
        };
        this.paths = new Map();
        this.errorMessages = {};
        this.defaultErrorMessage = "Please complete the required fields.";
        this.onChangeCallback = () => { };
        this.attr = FormDecision.attr;
        this.selector = createAttribute(FormDecision.attr.element);
        if (!component) {
            console.error(`FormDecision: Component not found.`);
            return;
        }
        else if (!component.hasAttribute("data-decision-component")) {
            console.error(`FormDecision: Selected element is not a FormDecision component:`, component);
            return;
        }
        this.component = component;
        this.opts = {
            id: options.id || this.component.getAttribute(this.attr.component) || this.opts.id,
            clearPathOnChange: options.clearPathOnChange || this.opts.clearPathOnChange,
            defaultPath: options.defaultPath || this.opts.defaultPath,
        };
        this.formMessage = new FormMessage("FormDecision", this.opts.id); // Assuming you want to initialize a FormMessage
        this.initialize();
    }
    /**
     * Initializes the FormDecision instance by setting up decision inputs & paths as well as their event listeners.
     */
    initialize() {
        // Find the decision element wrapper
        const decisionFieldsWrapper = this.component.querySelector(this.selector('decision')) ||
            this.component;
        const decisionInputsList = decisionFieldsWrapper.querySelectorAll(this.selector('input'));
        this.decisionInputs = Array.from(decisionInputsList);
        // Ensure there are decision inputs
        if (this.decisionInputs.length === 0) {
            console.warn(`Decision component "${this.opts.id}" does not contain any decision input elements.`);
            return;
        }
        // Iterate through the decision inputs
        this.decisionInputs.forEach((input) => {
            const pathId = input.getAttribute(this.attr.pathId) || input.value;
            const pathSelector = `${this.selector('path')}[${this.attr.pathId}="${pathId}"]`;
            const path = this.component.querySelector(pathSelector);
            if (path) {
                path.style.display = "none";
                this.initRequiredAttributes(path);
            }
            // Set path anyways to keep path id
            this.paths.set(pathId, path);
            input.addEventListener("change", (event) => {
                this.changeToPath(pathId, event);
            });
        });
        this.component.addEventListener("change", () => this.formMessage.reset());
    }
    /**
     * Handles changes to the decision input fields and updates the associated path visibility.
     * @param path The HTMLElement that contains the form fields of this path.
     * @param event The event that invokes this change.
     */
    changeToPath(pathId, event) {
        if (pathId === null) {
            this.hideAllPaths();
            this.decisionInputs.forEach(input => {
                setChecked(input, false);
            });
        }
        if (this.currentPath === pathId)
            return;
        const prevPath = this.paths.get(this.currentPath);
        if (prevPath) {
            prevPath.style.display = "none";
        }
        // Set new path id
        this.currentPath = pathId;
        const path = this.paths.get(this.currentPath);
        if (path) {
            path.style.removeProperty("display");
        }
        this.paths.forEach((path, pathId) => {
            this.updateRequiredAttributes(pathId);
            if (this.opts.clearPathOnChange) {
                this.clearPath(pathId);
            }
        });
        this.onChangeCallback();
        this.formMessage.reset();
    }
    reset(force) {
        this.clearAllPaths();
        this.changeToPath(force !== undefined ? force : this.opts.defaultPath);
    }
    /**
     * Sync the path shown do the actual selected path, if the component ever gets out of sync.
     */
    sync() {
        const path = this.getCurrentPath();
        this.changeToPath(path);
    }
    /**
     * Sets the display of all path elements to 'none'.
     */
    hideAllPaths() {
        this.paths.forEach((path) => {
            if (!path)
                return;
            path.style.display = "none";
        });
    }
    /**
     * Retrieves the currently selected decision input.
     * @returns The selected input element, or undefined if none is selected.
     */
    getSelectedInput() {
        return Array.from(this.decisionInputs).find((input) => input.checked);
    }
    /**
     * Retrieves the current `PathId` from the currently selected decision input.
     */
    getCurrentPath() {
        const selected = this.getSelectedInput();
        if (!selected)
            return null;
        return selected.getAttribute(this.attr.pathId);
    }
    /**
     * Validates the FormDecision based on the selected path to ensure the form's correctness.
     * @returns A boolean indicating whether the validation passed.
     */
    validate() {
        const selectedInput = this.getSelectedInput();
        const { isValid: decisionValid } = validateFields(this.decisionInputs);
        if (!decisionValid || !selectedInput) {
            console.warn("No decision selected!");
            this.handleValidationMessages(false);
            return false;
        }
        const pathId = selectedInput.getAttribute(this.attr.pathId) || selectedInput.value;
        // If no corresponding path, consider it valid
        const isValid = !this.paths.has(pathId) || this.checkPathValidity(pathId);
        this.handleValidationMessages(isValid);
        return isValid;
    }
    /**
     * Sets custom error messages for the decision inputs.
     * @param messages An object mapping decision input values to error messages.
     * @param defaultMessage An optional default error message to use when no specific message is provided.
     */
    setErrorMessages(messages, defaultMessage) {
        this.errorMessages = messages;
        if (defaultMessage) {
            this.defaultErrorMessage = defaultMessage;
        }
    }
    /**
     * Validates the fields within the specified path and returns whether they are valid.
     * @param pathIndex The index of the path to validate.
     * @returns A boolean indicating whether the specified path is valid.
     */
    checkPathValidity(pathId) {
        // Get the path element and the form inputs inside it
        const pathElement = this.paths.get(pathId);
        if (!pathElement)
            return true;
        const inputs = pathElement.querySelectorAll(wf.select.formInput);
        // Validate the fields within the path element
        const { isValid } = validateFields(inputs, true);
        return isValid;
    }
    initRequiredAttributes(path) {
        // For all paths, make inputs non-required by default
        const inputs = path.querySelectorAll(wf.select.input);
        inputs.forEach((input) => {
            input.setAttribute(this.attr.required, `${input.required}`);
            input.required = false;
        });
    }
    /**
     * Updates the required attributes of input fields within the paths based on the selected decision input.
     */
    updateRequiredAttributes(pathId) {
        // For the currently selected path, set inputs with [data-decision-required="required"] as required
        const path = this.paths.get(pathId);
        if (!path)
            return;
        if (pathId === this.currentPath) {
            const pathInputs = path.querySelectorAll(wf.select.formInput);
            pathInputs.forEach((input) => {
                const isRequired = input.matches(`[${this.attr.required}="required"], [${this.attr.required}="true"]`);
                input.required = isRequired;
            });
        }
        else {
            const pathInputs = path.querySelectorAll(wf.select.formInput);
            pathInputs.forEach((input) => {
                input.required = false;
            });
        }
    }
    clearPath(pathId, silent = false) {
        const path = this.paths.get(pathId);
        if (!path)
            return;
        const pathInputs = path.querySelectorAll(wf.select.formInput);
        pathInputs.forEach((input) => {
            input.value = null;
            if (silent)
                return;
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }
    clearAllPaths(clearCurrentPath = true) {
        this.paths.forEach((path, pathId) => {
            if (clearCurrentPath) {
                this.clearPath(pathId);
            }
            else if (pathId !== this.currentPath) {
                this.clearPath(pathId);
            }
        });
    }
    /**
     * Displays validation message based on the current path.
     * @param currentGroupValid A boolean indicating whether the current group of inputs is valid.
     */
    handleValidationMessages(currentGroupValid) {
        if (!currentGroupValid) {
            const customMessage = this.errorMessages[this.currentPath] || this.defaultErrorMessage;
            this.formMessage.error(customMessage);
        }
        else {
            this.formMessage.reset();
        }
    }
    onChange(callback) {
        this.clearOnChange();
        this.onChangeCallback = callback;
    }
    clearOnChange() {
        this.onChangeCallback = () => { };
    }
}
FormDecision.selector = createAttribute(FormDecision.attr.element);
