import createAttribute from "../attributeselector";
import wf from "../webflow";
import { WfFormData } from "../../types/webflow";
import { FieldGroupValidation } from "./fieldgroup";
import { getAllElements } from "../utils/getelements";

/**
 * Represents any standard form input element <input>, <select>, or <textarea>.
 */
export type HTMLFormInput = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
export type CustomValidator = () => boolean;
export type FormComponentElement = 'component' | 'success' | 'error' | 'submit' | 'modal';
type FilterFormElement = 'component' | 'field';

export interface RadioGroup {
  name: string;
  inputs: HTMLInputElement[];
}

// Form selector functions
const formElementSelector = createAttribute<FormComponentElement>('data-form-element');
const filterFormSelector = createAttribute<FilterFormElement>('data-filter-form');

/**
 * Check if a FormElement is a radio input.
 * @param {HTMLFormInput} input - The input that is to be checked.
 * @returns {boolean} True if the input is a radio button, otherwise false.
 */
export function isRadioInput(input: HTMLFormInput): input is HTMLInputElement {
  return input instanceof HTMLInputElement && input.type === "radio";
}

/**
 * Check if a FormElement is a checkbox input.
 * @param {HTMLFormInput} input - The input that is to be checked.
 * @returns {boolean} True if the input is a checkbox, otherwise false.
 */
export function isCheckboxInput(input: HTMLFormInput): input is HTMLInputElement {
  return input instanceof HTMLInputElement && input.type === "checkbox";
}

export function isFormInput(input: unknown): input is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return input instanceof HTMLInputElement ||
    input instanceof HTMLSelectElement ||
    input instanceof HTMLTextAreaElement;
}

export function getRadioGroups(source: HTMLElement | HTMLFormInput[], ...names: string[]): RadioGroup[] {
  let inputs: HTMLFormInput[];
  if (Array.isArray(source)) {
    inputs = source;
  } else if (source instanceof HTMLElement) {
    inputs = getAllElements<HTMLFormInput>(wf.select.formInput, { single: false, node: source });
  } else {
    throw new Error(`Invalid first parameter: expected "string", "HTMLElement" or "HTMLFormInput[]".`);
  }

  if (!inputs || !inputs.length) {
    return [];
  }

  const radioGroupMap = inputs.reduce<Map<string, RadioGroup>>((acc, input) => {
    if (!isRadioInput(input)) return acc;

    if (names.length && !names.includes(input.name)) return acc;

    if (!acc.has(input.name)) {
      acc.set(input.name, { name: input.name, inputs: [] });
    }

    acc.get(input.name)!.inputs.push(input);
    return acc;
  }, new Map());

  return Array.from(radioGroupMap.values());
}

export function getRadioGroupStrict(source: HTMLElement | HTMLFormInput[], name: string): RadioGroup {
  const groups = getRadioGroups(source, name);
  const group = groups[0];
  if (!group || !group.name) {
    throw new Error(`Radio group "${name}" not found.`);
  }

  if (groups.length > 1) {
    console.warn(`Get radio group: Multiple groups found for name "${name}". Returning the first.`);
  }

  if (!group.inputs.length) {
    console.warn(`Radio group "${name}" has no inputs.`);
  } else if (group.inputs.length === 1) {
    console.warn(`Radio group "${name}" has only 1 input.`);
  }

  return group;
}

export function getRadioGroup(source: HTMLElement | HTMLFormInput[], name: string): RadioGroup | null {
  try {
    return getRadioGroupStrict(source, name);
  } catch (e) {
    console.warn(`Get radio group: ${e.message}`);
    return null;
  }
}

export function findFormInput<T extends HTMLFormInput = HTMLFormInput>(
  containers: Iterable<HTMLElement>,
  inputId: string,
  selectorPrefix: string = wf.select.formInput
): T {
  const selector = `${selectorPrefix}#${inputId}`;

  const matches = Array.from(containers).flatMap(container =>
    Array.from(container.querySelectorAll<T>(selector))
  );

  if (matches.length === 0) {
    throw new Error(`No form input found with selector "${selector}".`);
  }

  if (matches.length > 1) {
    throw new Error(`Multiple form inputs found with selector "${selector}" - expected only one.`);
  }

  return matches[0];
}

export function findFormInputAll<T extends HTMLFormInput = HTMLFormInput>(
  containers: Iterable<HTMLElement>,
  inputId: string,
  selectorPrefix: string = wf.select.formInput
): T[] {
  const selector = `${selectorPrefix}#${inputId}`;

  const matches = Array.from(containers).flatMap(container =>
    Array.from(container.querySelectorAll<T>(selector))
  );

  return matches;
}

export function getWfFormData(form: HTMLFormElement | HTMLElement, fields: any, test: boolean = false): WfFormData {
  if (!(form instanceof HTMLFormElement)) {
    form = form.querySelector('form');
  }

  if (!form || !(form instanceof HTMLFormElement)) {
    throw new TypeError(`The passed "form" is not a form.`);
  }

  return {
    name: form.dataset.name,
    pageId: wf.pageId,
    elementId: form.dataset.wfElementId,
    source: window.location.href,
    fields: fields,
    test: test,
    dolphin: false,
  };
}

/**
 * Submit any form data to a Webflow site.
 *
 * @param formData The data submitted to the Webflow form api endpoint.
 *     Make sure the formData is an object, ready for JSON.stringify()
 */
export async function sendFormData(formData: any): Promise<boolean> {
  const url = `https://webflow.com/api/v1/form/${wf.siteId}`;
  const request: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
    body: JSON.stringify(formData),
  };

  try {
    const response = await fetch(url, request);

    if (!response.ok) {
      throw new Error(`Network response "${response.status}" was not okay`);
    }
    console.log("Form submission success! Status", response.status);
    return true;
  } catch (error) {
    console.error("Form submission failed:", error);
    return false;
  }
}

export function clearRadioGroup(container: HTMLElement, name: string, silent: boolean = false): void {
  const radioGroup = getRadioGroup(container, name);
  radioGroup.inputs.forEach(radio => {
    setChecked(radio, false, silent);
  });
}

export function setChecked(input: HTMLInputElement, checked: boolean, silent: boolean = false): void {
  if (!isRadioInput(input) && !isCheckboxInput(input)) {
    throw new Error(`Expected an input of type checkbox or radio.`);
  }

  input.checked = checked;

  if (isRadioInput(input)) {
    const wradio = input.closest(wf.select.wradio);
    const customRadio = wradio?.querySelector(wf.select.radio);
    if (customRadio) {
      customRadio.classList.toggle(wf.class.checked, checked);
    }
  }

  if (isCheckboxInput(input)) {
    const wcheckbox = input.closest(wf.select.wcheckbox);
    const customCheckbox = wcheckbox?.querySelector(wf.select.checkbox);
    if (customCheckbox) {
      customCheckbox.classList.toggle(wf.class.checked, checked);
    }
  }

  if (silent) return;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * Prevents unintended form submissions by setting missing <button> types to "button".
 */
export function enforceButtonTypes(form: HTMLFormElement | null): void {
  if (!form) return;
  const buttons = form.querySelectorAll("button:not([type])");
  buttons.forEach((button) => button.setAttribute("type", "button"));
}

/**
 * Initialize Webflow's native checkbox and radio elements.
 */
export function initWfInputs(container: HTMLElement) {
  // Constants for selectors and classes
  const inputTypes = [
    ["checkbox", wf.select.checkbox],
    ["radio", wf.select.radio],
  ];

  // Add change event listener for checkboxes
  container
    .querySelectorAll<HTMLInputElement>(wf.select.checkboxInput)
    .forEach((input) => {
      input.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        setChecked(target, target.checked, true);
      });
    });

  // Add change event listener for radio buttons
  container
    .querySelectorAll<HTMLInputElement>('input[type="radio"]')
    .forEach((input) => {
      input.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        if (!target.checked) return;

        const radioGroup = getRadioGroup(container, target.name);
        radioGroup.inputs.forEach(radio => {
          // Check the radio that was selected, uncheck all others in the group
          setChecked(radio, radio.value === target.value, true);
        });
      });
    });

  // Add focus and blur event listeners for checkboxes and radios
  inputTypes.forEach(([type, customClass]) => {
    container
      .querySelectorAll<HTMLInputElement>(
        `input[type="${type}"]:not(${customClass})`
      )
      .forEach((input) => {
        input.addEventListener("focus", (event) => {
          const target = event.target as HTMLInputElement;
          const customElement = target
            .closest(".w-checkbox, .w-radio")
            ?.querySelector(customClass);
          if (customElement) {
            customElement.classList.add(wf.class.focus);
            if (target.matches(wf.select.focused)) {
              customElement.classList.add(wf.class.focusVisible);
            }
          }
        });

        input.addEventListener("blur", (event) => {
          const target = event.target as HTMLInputElement;
          const customElement = target
            .closest(".w-checkbox, .w-radio")
            ?.querySelector(customClass);
          if (customElement) {
            customElement.classList.remove(wf.class.focus, wf.class.focusVisible);
          }
        });
      });
  });
}

export function reportValidity(input: HTMLFormInput): void {
  input.reportValidity();
  input.classList.add("has-error");
  if (isCheckboxInput(input)) {
    input.parentElement?.querySelector(wf.select.checkbox)?.classList.add("has-error");
  }

  if (input.type !== "checkbox" && input.type !== "radio") {
    input.addEventListener("input", () => removeErrorClasses(input), { once: true });
  } else {
    input.addEventListener("change", () => removeErrorClasses(input), { once: true });
  }
}

export function removeErrorClasses(input: HTMLFormInput): void {
  input.classList.remove("has-error");
  if (isCheckboxInput(input)) {
    input.parentElement?.querySelector(wf.select.checkbox)?.classList.remove("has-error");
  }
}

export function validateFields(
  inputs: NodeListOf<HTMLFormInput> | HTMLFormInput[],
  report: boolean = true
): FieldGroupValidation {
  let isValid = true; // Assume the step is valid unless we find a problem
  let invalidFields: HTMLFormInput[] = [];

  for (const input of Array.from(inputs)) {
    if (!input.checkValidity()) {
      invalidFields.push(input);
      isValid = false;
      if (report) {
        reportValidity(input);
      }
      break;
    } else {
      input.classList.remove("has-error");
    }
  }

  return { isValid, invalidFields };
}

export function disableWebflowForm(form: HTMLFormElement): void {
  form?.classList.remove("w-form");
  form.parentElement.classList.remove("w-form");
}

export {
  formElementSelector,
  filterFormSelector,
}
