import wf from "../webflow";
import { setChecked, HTMLFormInput, validateFields } from "./utility";
import { FormMessage } from "./formmessage";
import createAttribute from "../attributeselector";

interface FormDecisionAttributes {
  component: string;
  element: string;
  pathId: string;
  required: string;
}

export type FormDecisionElement =
  "component"
  | "decision"
  | "input"
  | "path";

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
export class FormDecision<PathId extends string = string> {
  public opts: FormDecisionOptions<PathId> = {
    id: undefined,
    clearPathOnChange: false,
    defaultPath: null,
  }
  public component: HTMLElement;
  public paths: DecisionPathMap<PathId> = new Map();
  private formMessage: FormMessage;
  private decisionInputs: HTMLInputElement[];
  private errorMessages: { [key: string]: string } = {};
  private defaultErrorMessage: string = "Please complete the required fields.";
  private onChangeCallback: () => void = () => { };
  private attr = FormDecision.attr;
  public static get attr(): FormDecisionAttributes {
    return {
      component: 'data-decision-component',
      element: 'data-decision-element',
      pathId: 'data-path-id',
      required: 'data-decision-required',
    }
  }

  private _currentPath: PathId;
  public get currentPath(): PathId {
    return this._currentPath;
  }
  private set currentPath(pathId: PathId) {
    this._currentPath = pathId;
  }

  /**
   * Constructs a new FormDecision instance.
   * @param component The FormDecision element.
   * @param id Unique identifier for the specific instance.
   */
  constructor(component: HTMLElement | null, options: Partial<FormDecisionOptions<PathId>>) {
    if (!component) {
      console.error(`FormDecision: Component not found.`);
      return;
    } else if (!component.hasAttribute("data-decision-component")) {
      console.error(
        `FormDecision: Selected element is not a FormDecision component:`,
        component
      );
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

  public static selector = createAttribute<FormDecisionElement>(FormDecision.attr.element);
  public selector = createAttribute<FormDecisionElement>(FormDecision.attr.element);

  /**
   * Initializes the FormDecision instance by setting up decision inputs & paths as well as their event listeners.
   */
  private initialize() {
    // Find the decision element wrapper
    const decisionFieldsWrapper: HTMLElement =
      this.component.querySelector(this.selector('decision')) ||
      this.component;
    const decisionInputsList =
      decisionFieldsWrapper.querySelectorAll<HTMLInputElement>(this.selector('input'));
    this.decisionInputs = Array.from(decisionInputsList);

    // Ensure there are decision inputs
    if (this.decisionInputs.length === 0) {
      console.warn(
        `Decision component "${this.opts.id}" does not contain any decision input elements.`
      );
      return;
    }

    // Iterate through the decision inputs
    this.decisionInputs.forEach((input) => {
      const pathId = input.getAttribute(this.attr.pathId) as PathId || input.value as PathId;
      const pathSelector = `${this.selector('path')}[${this.attr.pathId}="${pathId}"]`;
      const path: HTMLElement | null = this.component.querySelector(pathSelector);
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
  public changeToPath(pathId: PathId | null, event?: Event): void {
    if (pathId === null) {
      this.hideAllPaths();
      this.decisionInputs.forEach(input => {
        setChecked(input, false);
      });
    }

    if (this.currentPath === pathId) return;

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

  public reset(force?: PathId | null): void {
    this.clearAllPaths();
    this.changeToPath(force !== undefined ? force : this.opts.defaultPath);
  }

  /**
   * Sync the path shown do the actual selected path, if the component ever gets out of sync.
   */
  public sync(): void {
    const path = this.getCurrentPath();
    this.changeToPath(path);
  }

  /**
   * Sets the display of all path elements to 'none'.
   */
  private hideAllPaths(): void {
    this.paths.forEach((path) => {
      if (!path) return;
      path.style.display = "none";
    });
  }

  /**
   * Retrieves the currently selected decision input.
   * @returns The selected input element, or undefined if none is selected.
   */
  public getSelectedInput(): HTMLInputElement | undefined {
    return Array.from(this.decisionInputs).find((input) => input.checked);
  }

  /**
   * Retrieves the current `PathId` from the currently selected decision input.
   */
  private getCurrentPath(): PathId | null {
    const selected = this.getSelectedInput();
    if (!selected) return null;
    return selected.getAttribute(this.attr.pathId) as PathId;
  }

  /**
   * Validates the FormDecision based on the selected path to ensure the form's correctness.
   * @returns A boolean indicating whether the validation passed.
   */
  public validate(): boolean {
    const selectedInput = this.getSelectedInput();
    const { isValid: decisionValid } = validateFields(this.decisionInputs);
    if (!decisionValid || !selectedInput) {
      console.warn("No decision selected!");
      this.handleValidationMessages(false);
      return false;
    }

    const pathId = selectedInput.getAttribute(this.attr.pathId) as PathId || selectedInput.value as PathId;

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
  public setErrorMessages(
    messages: { [key: string]: string },
    defaultMessage?: string
  ): void {
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
  private checkPathValidity(pathId: PathId): boolean {
    // Get the path element and the form inputs inside it
    const pathElement = this.paths.get(pathId);
    if (!pathElement) return true;
    const inputs: NodeListOf<HTMLFormInput> =
      pathElement.querySelectorAll(wf.select.formInput);

    // Validate the fields within the path element
    const { isValid } = validateFields(inputs, true);
    return isValid;
  }

  private initRequiredAttributes(path: HTMLElement): void {
    // For all paths, make inputs non-required by default
    const inputs: NodeListOf<HTMLFormInput> = path.querySelectorAll(wf.select.input);
    inputs.forEach((input) => {
      input.setAttribute(this.attr.required, `${input.required}`);
      input.required = false;
    });
  }

  /**
   * Updates the required attributes of input fields within the paths based on the selected decision input.
   */
  private updateRequiredAttributes(pathId: PathId): void {
    // For the currently selected path, set inputs with [data-decision-required="required"] as required
    const path = this.paths.get(pathId);
    if (!path) return;

    if (pathId === this.currentPath) {
      const pathInputs = path.querySelectorAll<HTMLFormInput>(wf.select.formInput);
      pathInputs.forEach((input) => {
        const isRequired = input.matches(`[${this.attr.required}="required"], [${this.attr.required}="true"]`)
        input.required = isRequired;
      });
    } else {
      const pathInputs = path.querySelectorAll<HTMLFormInput>(wf.select.formInput);
      pathInputs.forEach((input) => {
        input.required = false;
      });
    }
  }

  public clearPath(pathId: PathId, silent: boolean = false): void {
    const path = this.paths.get(pathId);
    if (!path) return;

    const pathInputs = path.querySelectorAll<HTMLFormInput>(wf.select.formInput);
    pathInputs.forEach((input) => {
      input.value = null;
      if (silent) return;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  public clearAllPaths(clearCurrentPath: boolean = true): void {
    this.paths.forEach((path, pathId) => {
      if (clearCurrentPath) {
        this.clearPath(pathId);
      } else if (pathId !== this.currentPath) {
        this.clearPath(pathId);
      }
    });
  }

  /**
   * Displays validation message based on the current path.
   * @param currentGroupValid A boolean indicating whether the current group of inputs is valid.
   */
  private handleValidationMessages(currentGroupValid: boolean): void {
    if (!currentGroupValid) {
      const customMessage =
        this.errorMessages[this.currentPath] || this.defaultErrorMessage;
      this.formMessage.error(customMessage);
    } else {
      this.formMessage.reset();
    }
  }

  public onChange(callback: () => void): void {
    this.clearOnChange();
    this.onChangeCallback = callback;
  }

  public clearOnChange(): void {
    this.onChangeCallback = () => { };
  }
}
