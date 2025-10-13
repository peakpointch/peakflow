// Imports
import createAttribute, { exclude, extend } from "../attributeselector/index.js";
import {
  initWfInputs,
  sendFormData,
  validateFields,
  formElementSelector,
  fieldFromInput,
  enforceButtonTypes,
  type FormProgressComponent,
  FieldGroup,
  isCheckboxInput,
  setChecked,
  getRadioGroups,
} from "./index.js";
import {
  type FormFieldMap,
  type HTMLFormInput,
  type CustomValidator,
  FormProgressManager,
} from "./index.js";
import wf from "../webflow/index.js";
import { deepMerge } from "../utils";
import type { PartialDeep } from "type-fest";
import EventEmitter from "eventemitter3";

// Types
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

type StepsComponentElement =
  | "component"
  | "list"
  | "step"
  | "navigation"
  | "pagination"
  | "custom-component";
type StepsNavElement = "prev" | "next";
type MultiStepFormEvents =
  | "save"
  | "changeStep"
  | "submit"
  | "success"
  | "error"
  | "change"
  | "input";
type VirtualFieldFn<F = any, C = any> = (data: { fields: F; customFields: C }) => string;

// Selector functions
const stepsElementSelector = createAttribute<StepsComponentElement>("data-steps-element", {
  defaultExclusions: ['[data-steps-element="component"] [data-steps-element="component"] *'],
});
const stepsTargetSelector = createAttribute<string>("data-step-target");
const stepsNavSelector = createAttribute<StepsNavElement>("data-steps-nav");

const STEPS_PAGINATION_ITEM_SELECTOR: string = `button${stepsTargetSelector()}`;

export class MultiStepForm {
  public static readonly defaultOptions: MultiStepFormOptions = {
    id: "multistepform",
    version: "0.0.0",
    recaptcha: false,
    navigation: {
      hideInStep: -1,
    },
    excludeInputSelectors: [],
    nested: false,
    manager: undefined,
    pagination: {
      doneClass: "is-done",
      activeClass: "is-active",
    },
    validation: {
      validate: true,
      reportValidity: true,
    },
    jsonFields: false,
  };

  public id: string;
  public version: string;
  public options: MultiStepFormOptions;
  public initialized: boolean = false;
  public component: HTMLElement;
  public events: EventEmitter<MultiStepFormEvents>;
  public formElement: HTMLFormElement | HTMLElement;
  public formSteps: NodeListOf<HTMLElement>;
  public virtualFields: Map<string, string | VirtualFieldFn<any>>;
  private set currentStep(index: number) {
    this._currentStep = index;
  }
  public get currentStep(): number {
    return this._currentStep;
  }
  private _currentStep: number = 0;
  private navigationElement: HTMLElement;
  private paginationItems: NodeListOf<HTMLElement>;
  private buttonsNext: NodeListOf<HTMLElement>;
  private buttonsPrev: NodeListOf<HTMLElement>;
  private customComponents: Array<CustomFormComponent> = [];
  private successElement: HTMLElement | null;
  private errorElement: HTMLElement | null;
  private submitButton: HTMLInputElement | null;

  constructor(component: HTMLElement, options: PartialDeep<MultiStepFormOptions>) {
    this.component = component;
    this.options = deepMerge(MultiStepForm.defaultOptions, options);
    this.id = this.options.id;
    this.version = this.options.version;

    this.validateComponent();
    this.cacheDomElements();
    this.setupForm();
    this.setupEventListeners();
    this.initialized = true;
  }

  private validateComponent(): void {
    if (!this.component.getAttribute("data-steps-element")) {
      console.error(
        `Form Steps: Component is not a steps component or is missing the attribute ${stepsElementSelector("component")}.\nComponent:`,
        this.component,
      );
      throw new Error("Component is not a valid multi-step form component.");
    }
  }

  private cacheDomElements(): void {
    this.formElement = this.component.querySelector<HTMLFormElement>("form");
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
    this.submitButton = this.component.querySelector<HTMLInputElement>(
      formElementSelector("submit"),
    );
  }

  private setupForm(): void {
    if (!this.formSteps.length) {
      console.warn(
        `Form Steps: The selected list doesn't contain any steps. Skipping initialization. Provided List:`,
        this.component.querySelector(stepsElementSelector("list")),
      );
      return;
    }

    if (!this.options.nested) {
      enforceButtonTypes(this.formElement as HTMLFormElement);
      this.formElement.setAttribute("novalidate", "");
    }

    this.events = new EventEmitter<MultiStepFormEvents>();
    this.virtualFields = new Map();

    this.formElement.dataset.state = "initialized";

    initWfInputs(this.component);

    this.changeToStep(this.currentStep);
  }

  private setupEventListeners(): void {
    if (!this.options.nested) {
      this.formElement.addEventListener("submit", (event) => {
        event.preventDefault();
        this.submit();
        this.events.emit("submit");
      });
    }

    const inputs = this.formElement.querySelectorAll<HTMLFormInput>(
      exclude(
        wf.select.formInput,
        `${stepsElementSelector("custom-component", { exclusions: [] })} *`,
      ),
    );

    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        this.events.emit("input");
      });

      input.addEventListener("change", () => {
        this.events.emit("change");
      });
    });

    this.events.on("save", () => this.saveFields());
    this.initPagination();
    this.initChangeStepOnKeydown();
  }

  public addCustomComponent(component: CustomFormComponent): void {
    this.customComponents.push(component);
  }

  public async submit(): Promise<void> {
    if (this.options.nested) {
      throw new Error(`Can't submit a nested MultiStepForm.`);
    }

    if (this.currentStep !== this.formSteps.length - 1) {
      console.error(
        "SUBMIT ERROR: the current step is not the last step. Can only submit the MultiStepForm in the last step.",
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

    // Submit form
    const success = await sendFormData(formData);

    if (success) {
      this.emitOnSuccess();
    } else {
      this.emitOnError();
    }
  }

  private buildJsonForWebflow(): any {
    if (this.options.nested) {
      throw new Error(`Can't get FormData for a nested MultiStepForm.`);
    }

    const fields = this.getFormData();

    if (this.options.recaptcha) {
      const recaptcha = (this.formElement.querySelector("#g-recaptcha-response") as HTMLFormInput)
        .value;
      fields["g-recaptcha-response"] = recaptcha;
      if (!recaptcha) {
        this.emitOnError();
        throw new Error(`Form "${this.id}": Recaptcha response invalid.`);
      }
    }

    return {
      name: this.formElement.dataset.name,
      pageId: wf.pageId,
      elementId: this.formElement.dataset.wfElementId,
      source: window.location.href,
      test: false,
      fields: fields,
      dolphin: false,
    };
  }

  private emitOnSuccess(): void {
    if (this.errorElement) this.errorElement.style.display = "none";
    if (this.successElement) this.successElement.style.display = "block";
    this.formElement.style.display = "none";
    this.formElement.dataset.state = "success";
    this.formElement.dispatchEvent(new CustomEvent("formSuccess"));
    this.events.emit("success");

    if (this.submitButton) {
      this.submitButton.value = this.submitButton.dataset.defaultText || "Submit";
    }
  }

  private emitOnError(): void {
    if (this.errorElement) this.errorElement.style.display = "block";
    if (this.successElement) this.successElement.style.display = "none";
    this.formElement.dataset.state = "error";
    this.formElement.dispatchEvent(new CustomEvent("formError"));
    this.events.emit("error");

    if (this.submitButton) {
      this.submitButton.value = this.submitButton.dataset.defaultText || "Submit";
    }
  }

  private initChangeStepOnKeydown(): void {
    this.formSteps.forEach((step, index) => {
      step.dataset.stepId = index.toString();
      step.classList.toggle("hide", index !== this.currentStep);

      step
        .querySelectorAll<HTMLInputElement>(wf.select.formInput) // Type necessary for keydown event
        .forEach((input) => {
          input.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === "Enter") {
              event.preventDefault();
              this.changeToNext();
            }
          });
        });
    });
  }

  private initPagination(): void {
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
  public changeToNext() {
    if (this.currentStep < this.formSteps.length - 1) {
      this.changeToStep(this.currentStep + 1);
    }
  }

  /**
   * Change to the previous step.
   */
  public changeToPrevious() {
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
  public changeToStep(index: number): void {
    if (this.currentStep === index && this.initialized) {
      // console.log('Change Form Step: Target step equals current step.');
      // console.log(`Step ${this.currentStep + 1}/${this.formSteps.length}`);
      return;
    }

    if (index > this.currentStep && this.initialized) {
      for (let step = this.currentStep; step < index; step++) {
        // Validate standard fields in the current step
        if (!this.validateCurrentStep(step)) {
          this.changeToStep(step);
          return;
        }
      }

      this.component.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    // Fire custom event before updating the visibility
    const event = new CustomEvent("changeStep", {
      detail: { previousStep: this.currentStep, currentStep: index },
    });
    this.component.dispatchEvent(event);
    this.events.emit("changeStep");
    this.events.emit("save");

    this.updateStepVisibility(index);
    this.updatePagination(index);
    this.currentStep = index;
    console.log(`Step ${this.currentStep + 1}/${this.formSteps.length}`);
  }

  private updateStepVisibility(target: number): void {
    const current = this.formSteps[this.currentStep];
    const next = this.formSteps[target];

    // Call user-defined handler if set
    if (this.options.onStepChange) {
      this.options.onStepChange({
        index: target,
        currentStep: current,
        targetStep: next,
      });
    } else {
      // Default behavior
      current.classList.add("hide");
      next.classList.remove("hide");
    }
  }

  public set onChangeStep(callback: StepChangeCallback) {
    this.options.onStepChange = callback;
  }

  private updatePagination(target: number): void {
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

  public validateAllSteps(): boolean {
    let allValid = true;

    this.formSteps.forEach((_, index) => {
      if (!this.validateCurrentStep(index)) {
        console.warn(`Step ${index + 1} is invalid.`);
        allValid = false; // Set the flag to false if any step is invalid
        this.changeToStep(index);
      }
    });

    return allValid;
  }

  public validateCurrentStep(stepIndex: number): boolean {
    if (!this.options.validation.validate) return true;
    const basicError = `Validation failed for step: ${stepIndex + 1}/${this.formSteps.length}`;
    const currentStepElement = this.formSteps[stepIndex];
    const inputs: NodeListOf<HTMLFormInput> = currentStepElement.querySelectorAll(
      wf.select.formInput,
    );

    // TODO: Fix this overkill approach
    const filteredInputs = Array.from(inputs).filter((input) => {
      // Check if the input matches any exclude selectors or is inside an excluded wrapper
      const isExcluded = this.options.excludeInputSelectors.some((selector) => {
        return input.closest(`${selector}`) !== null || input.matches(selector);
      });
      return !isExcluded;
    });

    let { isValid } = validateFields(filteredInputs, this.options.validation.reportValidity);

    if (!isValid && this.options.validation.reportValidity) {
      console.warn(`${basicError}: Standard validation is not valid`);
    }

    if (!isValid) return false;

    const customValidators: CustomValidator[] = this.customComponents
      .filter((entry) => entry.stepIndex === stepIndex)
      .map((entry) => () => entry.validator());

    // Custom validations
    const customValid = customValidators?.every((validator) => validator()) ?? true;
    if (this.options.validation.reportValidity && !customValid) {
      console.warn(`${basicError}: Custom validation is not valid`);
    }

    return isValid && customValid;
  }

  public getFormInputs(step?: number): HTMLFormInput[] {
    const inputs: HTMLFormInput[] = [];
    const steps = step === undefined ? Array.from(this.formSteps) : [this.formSteps[step]];

    steps.forEach((step) => {
      const found = step.querySelectorAll<HTMLFormInput>(
        exclude(
          wf.select.formInput,
          `${stepsElementSelector("custom-component", { exclusions: [] })} *`,
        ),
      );

      inputs.push(...Array.from(found));
    });

    return inputs;
  }

  /**
   * Gets data of all form fields in a `FieldGroup`.
   *
   * @step Step index of the multi step form
   * @returns A `FieldGroup`
   *
   * Fields that are a descendant of '[data-steps-element="custom-component"]' are excluded.
   */
  public getFieldGroup(step?: number): FieldGroup {
    let fields: FormFieldMap = new Map();
    const stepInputs = this.getFormInputs(step);

    stepInputs.forEach((input, inputIndex) => {
      const entry = fieldFromInput(input, inputIndex);
      if (entry.id) {
        fields.set(entry.id, entry);
      }
    });

    return new FieldGroup(fields);
  }

  public getFormData(): any {
    const fields = this.getFieldGroup().serialize({
      stringify: this.options.jsonFields,
      valueOnly: !this.options.jsonFields,
    });
    const customFields = this.customComponents.reduce((acc, entry) => {
      return {
        ...acc,
        ...(entry.getData ? entry.getData() : {}),
      };
    }, {});

    const virtualFields = Array.from(this.virtualFields.entries()).reduce((acc, [key, val]) => {
      let value = typeof val === "function" ? val({ fields, customFields }) : (val ?? "");
      return {
        ...acc,
        [key]: value,
      };
    }, {});

    return {
      ...fields,
      ...customFields,
      ...virtualFields,
    };
  }

  public getFormInput<T extends HTMLFormInput = HTMLFormInput>(id: string): T {
    const selector = extend(wf.select.formInput, `#${id}`);
    return this.component.querySelector(selector);
  }

  public loadProgress(): void {
    const form = this.options.manager.getForm(this.id);
    const data = FieldGroup.deserialize(form.fields);
    const inputs = this.getFormInputs();

    const [radioInputs, otherInputs] = inputs.reduce(
      ([radios, other], input) => {
        input.type === "radio" ? radios.push(input as HTMLInputElement) : other.push(input);
        return [radios, other];
      },
      [[] as HTMLInputElement[], [] as HTMLFormInput[]],
    );

    otherInputs.forEach((input) => {
      const field = data.getField(input.id);
      if (!field) return;
      if (input.type === "select-one") console.log(`SELECT FIELD "${field.id}": "${field.value}"`);

      if (!isCheckboxInput(input)) {
        // For text inputs, trim and set the value
        input.value = field.value.trim();
      } else {
        setChecked(input, field.checked);
      }
    });

    const radioGroups = getRadioGroups(radioInputs);
    radioGroups.forEach((radioGroup) => {
      const field = data.getField(radioGroup.name);
      if (!field) return;

      radioGroup.inputs.forEach((radio) => {
        setChecked(radio, radio.value === field.value ? field.checked : false);
      });
    });
  }

  public saveFields(): void {
    const data = this.getFieldGroup().serialize();
    const form = this.options.manager.getForm(this.id);
    form.fields = data;
    this.options.manager.saveForm(this.id, form);
  }

  public saveComponentProgress(component: FormProgressComponent): void {
    const form = this.options.manager.getForm(this.id);
    const foundIndex = form.components.findIndex((c) => c.id === component.id);
    if (foundIndex === -1) {
      form.components.push(component);
    } else {
      form.components[foundIndex] = component;
    }
    this.options.manager.saveForm(this.id, form);
  }

  public onSave(callback: (...args: any[]) => void): void {
    this.events.on("save", callback);
  }

  public clearOnSave(): void {
    this.events.removeListener("save");
  }
}
