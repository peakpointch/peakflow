import wf from "@library/webflow";
import { HTMLFormInput, validateFields } from "./utility";
import { FormMessage } from "./formmessage";

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
 *       <input type="radio" data-decision-action="path1">
 *       <input type="radio" data-decision-action="path2">
 *     </div>
 *     <div data-decision-path="path1"></div>
 *     <div data-decision-path="path2"></div>
 *   </div>
 *   ```
 */
export class FormDecision {
  private component: HTMLElement;
  private paths: HTMLElement[] = [];
  private id: string;
  private formMessage: FormMessage;
  private decisionInputs: NodeListOf<HTMLInputElement>;
  private errorMessages: { [key: string]: string } = {};
  private defaultErrorMessage: string = "Please complete the required fields.";

  /**
   * Constructs a new FormDecision instance.
   * @param component The FormDecision element.
   * @param id Unique identifier for the specific instance.
   */
  constructor(component: HTMLElement | null, id: string | undefined) {
    if (!component || !id) {
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
    this.id = id;
    this.formMessage = new FormMessage("FormDecision", id); // Assuming you want to initialize a FormMessage
    this.initialize();
  }

  /**
   * Initializes the FormDecision instance by setting up decision inputs & paths as well as their event listeners.
   */
  private initialize() {
    // Find the decision element wrapper
    const decisionFieldsWrapper: HTMLElement =
      this.component.querySelector('[data-decision-element="decision"]') ||
      this.component;
    this.decisionInputs =
      decisionFieldsWrapper.querySelectorAll<HTMLInputElement>(
        "input[data-decision-action]"
      );

    // Ensure there are decision inputs
    if (this.decisionInputs.length === 0) {
      console.warn(
        `Decision component "${this.id}" does not contain any decision input elements.`
      );
      return;
    }

    // Iterate through the decision inputs
    this.decisionInputs.forEach((input) => {
      const path: HTMLElement | null = this.component.querySelector(
        `[data-decision-path="${input.dataset.decisionAction || input.value}"]`
      );
      if (path) {
        path.style.display = "none";
        this.paths.push(path);
      }

      input.addEventListener("change", (event) => {
        this.handleChange(path, event);
        this.formMessage.reset();
      });
    });

    this.component.addEventListener("change", () => this.formMessage.reset());
  }

  /**
   * Handles changes to the decision input fields and updates the associated path visibility.
   * @param path The HTMLElement that contains the form fields of this path.
   * @param event The event that invokes this change.
   */
  private handleChange(path: HTMLElement | null, event: Event): void {
    this.paths.forEach((entry) => {
      entry.style.display = "none";
    });

    if (path) {
      path.style.removeProperty("display");
    }

    this.updateRequiredAttributes();
  }

  /**
   * Retrieves the currently selected decision input.
   * @returns The selected input element, or undefined if none is selected.
   */
  private getSelectedInput(): HTMLInputElement | undefined {
    return Array.from(this.decisionInputs).find((input) => input.checked);
  }

  /**
   * Validates the FormDecision based on the selected path to ensure the form's correctness.
   * @returns A boolean indicating whether the validation passed.
   */
  public validate(): boolean {
    const selectedInput = this.getSelectedInput();
    const { valid: decisionValid } = validateFields(this.decisionInputs);
    if (!decisionValid || !selectedInput) {
      console.warn("No decision selected!");
      this.handleValidationMessages(false);
      return false;
    }

    const pathId = selectedInput.dataset.decisionAction || selectedInput.value;
    const pathIndex = this.paths.findIndex(
      (path) => path.dataset.decisionPath === pathId
    );

    // If no corresponding path, consider it valid
    const isValid = pathIndex === -1 || this.checkPathValidity(pathIndex);
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
  private checkPathValidity(pathIndex: number): boolean {
    // Get the path element and the form inputs inside it
    const pathElement = this.paths[pathIndex];
    const inputs: NodeListOf<HTMLFormInput> =
      pathElement.querySelectorAll(wf.select.formInput);

    // Validate the fields within the path element
    const { valid, invalidField } = validateFields(inputs, true);

    return valid;
  }

  /**
   * Updates the required attributes of input fields within the paths based on the selected decision input.
   */
  private updateRequiredAttributes() {
    // For all paths, make inputs non-required by default
    this.paths.forEach((path) => {
      const inputs: NodeListOf<HTMLFormInput> = path.querySelectorAll(
        "input, select, textarea"
      );
      inputs.forEach((input) => {
        input.required = false;
      });
    });

    // For the currently selected path, set inputs with [data-decision-required="required"] as required
    const selectedInput = this.component.querySelector<HTMLInputElement>(
      "input[data-decision-action]:checked"
    );
    if (selectedInput) {
      const pathId =
        selectedInput.dataset.decisionAction || selectedInput.value;
      const selectedPath = this.paths.find(
        (path) => path.dataset.decisionPath === pathId
      );

      if (selectedPath) {
        const requiredFields: NodeListOf<HTMLFormInput> =
          selectedPath.querySelectorAll(
            '[data-decision-required="required"], [data-decision-required="true"]'
          );
        requiredFields.forEach((input) => {
          input.required = true;
        });
      }
    }
  }

  /**
   * Displays validation message based on the current path.
   * @param currentGroupValid A boolean indicating whether the current group of inputs is valid.
   */
  private handleValidationMessages(currentGroupValid: boolean): void {
    if (!currentGroupValid) {
      const selectedInput = this.getSelectedInput();
      const pathId = selectedInput?.dataset.decisionAction || selectedInput?.value;
      const customMessage =
        this.errorMessages[pathId!] || this.defaultErrorMessage;
      this.formMessage.error(customMessage);
    } else {
      this.formMessage.reset();
    }
  }
}

