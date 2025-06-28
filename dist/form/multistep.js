import createAttribute, { exclude, extend } from "../attributeselector";
import {
  initWfInputs,
  sendFormData,
  validateFields,
  formElementSelector,
  fieldFromInput,
  enforceButtonTypes
} from ".";
import wf from "../webflow";
import mapToObject from "../utils/maptoobject";
import deepMerge from "../utils/deepmerge";
;
const stepsElementSelector = createAttribute("data-steps-element", {
  defaultExclusions: ['[data-steps-element="component"] [data-steps-element="component"] *']
});
const stepsTargetSelector = createAttribute("data-step-target");
const stepsNavSelector = createAttribute("data-steps-nav");
const STEPS_PAGINATION_ITEM_SELECTOR = `button${stepsTargetSelector()}`;
class MultiStepForm {
  constructor(component, options) {
    this.options = {
      recaptcha: false,
      navigation: {
        hideInStep: -1
      },
      excludeInputSelectors: [],
      nested: false,
      pagination: {
        doneClass: "is-done",
        activeClass: "is-active"
      },
      validation: {
        validate: true,
        reportValidity: true
      }
    };
    this.initialized = false;
    this._currentStep = 0;
    this.customComponents = [];
    this.component = component;
    this.options = deepMerge(this.options, options);
    this.validateComponent();
    this.cacheDomElements();
    this.setupForm();
    this.setupEventListeners();
    this.initialized = true;
  }
  set currentStep(index) {
    this._currentStep = index;
  }
  get currentStep() {
    return this._currentStep;
  }
  validateComponent() {
    if (!this.component.getAttribute("data-steps-element")) {
      console.error(
        `Form Steps: Component is not a steps component or is missing the attribute ${stepsElementSelector("component")}.
Component:`,
        this.component
      );
      throw new Error("Component is not a valid multi-step form component.");
    }
  }
  cacheDomElements() {
    this.formElement = this.component.querySelector("form");
    if (!this.options.nested && !this.formElement) {
      throw new Error("Form element not found within the specified component.");
    }
    if (this.options.nested) {
      this.formElement = this.component;
    }
    this.formSteps = this.component.querySelectorAll(stepsElementSelector("step"));
    this.paginationItems = this.component.querySelectorAll(STEPS_PAGINATION_ITEM_SELECTOR);
    this.navigationElement = this.component.querySelector(stepsElementSelector("navigation"));
    this.buttonsNext = this.component.querySelectorAll(stepsNavSelector("next"));
    this.buttonsPrev = this.component.querySelectorAll(stepsNavSelector("prev"));
    this.successElement = this.component.querySelector(formElementSelector("success"));
    this.errorElement = this.component.querySelector(formElementSelector("error"));
    this.submitButton = this.component.querySelector(formElementSelector("submit"));
  }
  setupForm() {
    if (!this.formSteps.length) {
      console.warn(
        `Form Steps: The selected list doesn't contain any steps. Skipping initialization. Provided List:`,
        this.component.querySelector(stepsElementSelector("list"))
      );
      return;
    }
    if (!this.options.nested) {
      enforceButtonTypes(this.formElement);
      this.formElement.setAttribute("novalidate", "");
    }
    this.formElement.dataset.state = "initialized";
    initWfInputs(this.component);
    this.changeToStep(this.currentStep);
  }
  setupEventListeners() {
    if (!this.options.nested) {
      this.formElement.addEventListener("submit", (event) => {
        event.preventDefault();
        this.submitToWebflow();
      });
    }
    this.initPagination();
    this.initChangeStepOnKeydown();
  }
  addCustomComponent(component) {
    this.customComponents.push(component);
  }
  async submitToWebflow() {
    if (this.options.nested) {
      throw new Error(`Can't submit a nested MultiStepForm.`);
    }
    if (this.currentStep !== this.formSteps.length - 1) {
      console.error(
        "SUBMIT ERROR: the current step is not the last step. Can only submit the MultiStepForm in the last step."
      );
      return;
    }
    const allStepsValid = this.validateAllSteps();
    if (!allStepsValid) {
      console.warn("Form submission blocked: Not all steps are valid.");
      return;
    }
    this.formElement.dataset.state = "sending";
    if (this.submitButton) {
      this.submitButton.dataset.defaultText = this.submitButton.value;
      this.submitButton.value = this.submitButton.dataset.wait || "Wird gesendet ...";
    }
    const formData = this.buildJsonForWebflow();
    debugger;
    const success = await sendFormData(formData);
    if (success) {
      this.onFormSuccess();
    } else {
      this.onFormError();
    }
  }
  buildJsonForWebflow() {
    if (this.options.nested) {
      throw new Error(`Can't get FormData for a nested MultiStepForm.`);
    }
    const fields = this.getFormData();
    if (this.options.recaptcha) {
      const recaptcha = this.formElement.querySelector("#g-recaptcha-response").value;
      fields["g-recaptcha-response"] = recaptcha;
    }
    return {
      name: this.formElement.dataset.name,
      pageId: wf.pageId,
      elementId: this.formElement.dataset.wfElementId,
      source: window.location.href,
      test: false,
      fields,
      dolphin: false
    };
  }
  onFormSuccess() {
    if (this.errorElement) this.errorElement.style.display = "none";
    if (this.successElement) this.successElement.style.display = "block";
    this.formElement.style.display = "none";
    this.formElement.dataset.state = "success";
    this.formElement.dispatchEvent(new CustomEvent("formSuccess"));
    if (this.submitButton) {
      this.submitButton.value = this.submitButton.dataset.defaultText || "Submit";
    }
  }
  onFormError() {
    if (this.errorElement) this.errorElement.style.display = "block";
    if (this.successElement) this.successElement.style.display = "none";
    this.formElement.dataset.state = "error";
    this.formElement.dispatchEvent(new CustomEvent("formError"));
    if (this.submitButton) {
      this.submitButton.value = this.submitButton.dataset.defaultText || "Submit";
    }
  }
  initChangeStepOnKeydown() {
    this.formSteps.forEach((step, index) => {
      step.dataset.stepId = index.toString();
      step.classList.toggle("hide", index !== this.currentStep);
      step.querySelectorAll(wf.select.formInput).forEach((input) => {
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            this.changeToNext();
          }
        });
      });
    });
  }
  initPagination() {
    this.paginationItems.forEach((item, index) => {
      item.dataset.stepTarget = index.toString();
      item.addEventListener("click", (event) => {
        event.preventDefault();
        this.changeToStep(index);
      });
    });
    this.buttonsNext.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.changeToNext();
      });
    });
    this.buttonsPrev.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        this.changeToPrevious();
      });
    });
  }
  /**
   * Change to the next step.
   */
  changeToNext() {
    if (this.currentStep < this.formSteps.length - 1) {
      this.changeToStep(this.currentStep + 1);
    }
  }
  /**
   * Change to the previous step.
   */
  changeToPrevious() {
    if (this.currentStep > 0) {
      this.changeToStep(this.currentStep - 1);
    }
  }
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
  changeToStep(index) {
    if (this.currentStep === index && this.initialized) {
      return;
    }
    if (index > this.currentStep && this.initialized) {
      for (let step = this.currentStep; step < index; step++) {
        if (!this.validateCurrentStep(step)) {
          this.changeToStep(step);
          return;
        }
      }
      this.component.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
    const event = new CustomEvent("changeStep", {
      detail: { previousStep: this.currentStep, currentStep: index }
    });
    this.component.dispatchEvent(event);
    this.updateStepVisibility(index);
    this.updatePagination(index);
    this.currentStep = index;
    console.log(`Step ${this.currentStep + 1}/${this.formSteps.length}`);
  }
  updateStepVisibility(target) {
    const current = this.formSteps[this.currentStep];
    const next = this.formSteps[target];
    if (this.options.onStepChange) {
      this.options.onStepChange({
        index: target,
        currentStep: current,
        targetStep: next
      });
    } else {
      current.classList.add("hide");
      next.classList.remove("hide");
    }
  }
  set onChangeStep(callback) {
    this.options.onStepChange = callback;
  }
  updatePagination(target) {
    this.buttonsPrev.forEach((button) => {
      if (target === 0) {
        button.style.visibility = "hidden";
        button.style.opacity = "0";
      } else {
        button.style.visibility = "visible";
        button.style.opacity = "1";
      }
    });
    this.buttonsNext.forEach((button) => {
      if (target === this.formSteps.length - 1) {
        button.style.visibility = "hidden";
        button.style.opacity = "0";
      } else {
        button.style.visibility = "visible";
        button.style.opacity = "1";
      }
    });
    if (target === this.options.navigation.hideInStep) {
      this.navigationElement.style.visibility = "hidden";
      this.navigationElement.style.opacity = "0";
    } else {
      this.navigationElement.style.removeProperty("visibility");
      this.navigationElement.style.removeProperty("opacity");
    }
    this.paginationItems.forEach((step, index) => {
      step.classList.toggle(this.options.pagination.doneClass, index < target);
      step.classList.toggle(this.options.pagination.activeClass, index === target);
    });
  }
  validateAllSteps() {
    let allValid = true;
    this.formSteps.forEach((_, index) => {
      if (!this.validateCurrentStep(index)) {
        console.warn(`Step ${index + 1} is invalid.`);
        allValid = false;
        this.changeToStep(index);
      }
    });
    return allValid;
  }
  validateCurrentStep(stepIndex) {
    if (!this.options.validation.validate) return true;
    const basicError = `Validation failed for step: ${stepIndex + 1}/${this.formSteps.length}`;
    const currentStepElement = this.formSteps[stepIndex];
    const inputs = currentStepElement.querySelectorAll(wf.select.formInput);
    const filteredInputs = Array.from(inputs).filter((input) => {
      const isExcluded = this.options.excludeInputSelectors.some(
        (selector) => {
          return input.closest(`${selector}`) !== null || input.matches(selector);
        }
      );
      return !isExcluded;
    });
    let { isValid } = validateFields(filteredInputs, this.options.validation.reportValidity);
    if (!isValid && this.options.validation.reportValidity) {
      console.warn(`${basicError}: Standard validation is not valid`);
    }
    if (!isValid) return false;
    const customValidators = this.customComponents.filter((entry) => entry.stepIndex === stepIndex).map((entry) => () => entry.validator());
    const customValid = customValidators?.every((validator) => validator()) ?? true;
    if (this.options.validation.reportValidity && !customValid) {
      console.warn(`${basicError}: Custom validation is not valid`);
    }
    return isValid && customValid;
  }
  /**
   * Gets data of all form fields in a `FormFieldMap`.
   *
   * @step Step index of the multi step form
   * @returns `FormFieldMap` - A map of field id (string) to a `FormField` class instance
   *
   * Fields that are a descendant of '[data-steps-element="custom-component"]' are excluded.
   */
  getFieldMapForStep(step) {
    let fields = /* @__PURE__ */ new Map();
    const stepElement = this.formSteps[step];
    const stepInputs = stepElement.querySelectorAll(exclude(wf.select.formInput, `${stepsElementSelector("custom-component", { exclusions: [] })} *`));
    stepInputs.forEach((input, inputIndex) => {
      const entry = fieldFromInput(input, inputIndex);
      if (entry.id) {
        fields.set(entry.id, entry.value);
      }
    });
    return fields;
  }
  getFieldMap() {
    const fields = Array.from(this.formSteps).reduce((acc, _, stepIndex) => {
      const stepData = this.getFieldMapForStep(stepIndex);
      return new Map([
        ...acc,
        ...stepData
      ]);
    }, /* @__PURE__ */ new Map());
    return fields;
  }
  getFormData() {
    const customFields = this.customComponents.reduce((acc, entry) => {
      return {
        ...acc,
        ...entry.getData ? entry.getData() : {}
      };
    }, {});
    const fields = {
      ...mapToObject(this.getFieldMap(), false),
      ...customFields
    };
    return fields;
  }
  getFormInput(id) {
    const selector = extend(wf.select.formInput, `#${id}`);
    return this.component.querySelector(selector);
  }
}
export {
  MultiStepForm
};
