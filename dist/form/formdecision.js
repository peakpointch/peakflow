import wf from "../webflow";
import { validateFields } from "./utility";
import { FormMessage } from "./formmessage";
class FormDecision {
  /**
   * Constructs a new FormDecision instance.
   * @param component The FormDecision element.
   * @param id Unique identifier for the specific instance.
   */
  constructor(component, id) {
    this.paths = [];
    this.errorMessages = {};
    this.defaultErrorMessage = "Please complete the required fields.";
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
    this.formMessage = new FormMessage("FormDecision", id);
    this.initialize();
  }
  /**
   * Initializes the FormDecision instance by setting up decision inputs & paths as well as their event listeners.
   */
  initialize() {
    const decisionFieldsWrapper = this.component.querySelector('[data-decision-element="decision"]') || this.component;
    this.decisionInputs = decisionFieldsWrapper.querySelectorAll(
      "input[data-decision-action]"
    );
    if (this.decisionInputs.length === 0) {
      console.warn(
        `Decision component "${this.id}" does not contain any decision input elements.`
      );
      return;
    }
    this.decisionInputs.forEach((input) => {
      const path = this.component.querySelector(
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
  handleChange(path, event) {
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
  getSelectedInput() {
    return Array.from(this.decisionInputs).find((input) => input.checked);
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
    const pathId = selectedInput.dataset.decisionAction || selectedInput.value;
    const pathIndex = this.paths.findIndex(
      (path) => path.dataset.decisionPath === pathId
    );
    const isValid = pathIndex === -1 || this.checkPathValidity(pathIndex);
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
  checkPathValidity(pathIndex) {
    const pathElement = this.paths[pathIndex];
    const inputs = pathElement.querySelectorAll(wf.select.formInput);
    const { isValid } = validateFields(inputs, true);
    return isValid;
  }
  /**
   * Updates the required attributes of input fields within the paths based on the selected decision input.
   */
  updateRequiredAttributes() {
    this.paths.forEach((path) => {
      const inputs = path.querySelectorAll(
        "input, select, textarea"
      );
      inputs.forEach((input) => {
        input.required = false;
      });
    });
    const selectedInput = this.component.querySelector(
      "input[data-decision-action]:checked"
    );
    if (selectedInput) {
      const pathId = selectedInput.dataset.decisionAction || selectedInput.value;
      const selectedPath = this.paths.find(
        (path) => path.dataset.decisionPath === pathId
      );
      if (selectedPath) {
        const requiredFields = selectedPath.querySelectorAll(
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
  handleValidationMessages(currentGroupValid) {
    if (!currentGroupValid) {
      const selectedInput = this.getSelectedInput();
      const pathId = selectedInput?.dataset.decisionAction || selectedInput?.value;
      const customMessage = this.errorMessages[pathId] || this.defaultErrorMessage;
      this.formMessage.error(customMessage);
    } else {
      this.formMessage.reset();
    }
  }
}
export {
  FormDecision
};
