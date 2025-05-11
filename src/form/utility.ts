import createAttribute from "@library/attributeselector";
import wf from "@library/webflow";
import { WfFormData } from "~/types/webflow";

// Types
type HTMLFormInput = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type CustomValidator = () => boolean;
type FormComponentElement = 'component' | 'success' | 'error' | 'submit' | 'modal';
type FilterFormElement = 'component' | 'field';

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

export function clearRadioGroup(container: HTMLElement, name: string) {
  container
    .querySelectorAll<HTMLInputElement>(
      `${wf.select.radioInput}[name="${name}"]`
    )
    .forEach((radio) => {
      radio.checked = false; // Uncheck all radios in the group
      const customRadio = radio
        .closest(".w-radio")
        ?.querySelector(wf.select.radio);
      if (customRadio) {
        customRadio.classList.remove(wf.class.checked); // Remove the checked styling
      }
    });
}

export function initCustomInputs(container: HTMLElement) {
  // Constants for selectors and classes
  const focusClass = "w--redirected-focus";
  const focusVisibleClass = "w--redirected-focus-visible";
  const focusVisibleSelector = ":focus-visible, [data-wf-focus-visible]";
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
        const customCheckbox = target
          .closest(".w-checkbox")
          ?.querySelector(wf.select.checkbox);
        if (customCheckbox) {
          customCheckbox.classList.toggle(wf.class.checked, target.checked);
        }
      });
    });

  // Add change event listener for radio buttons
  container
    .querySelectorAll<HTMLInputElement>('input[type="radio"]')
    .forEach((input) => {
      input.addEventListener("change", (event) => {
        const target = event.target as HTMLInputElement;
        if (!target.checked) return;

        // Deselect other radios in the same group
        const name = target.name;
        container
          .querySelectorAll<HTMLInputElement>(
            `input[type="radio"][name="${name}"]`
          )
          .forEach((radio) => {
            const customRadio = radio
              .closest(".w-radio")
              ?.querySelector(wf.select.radio);
            if (customRadio) {
              customRadio.classList.remove(wf.class.checked);
            }
          });

        // Add the checked class to the selected radio's custom container
        const selectedCustomRadio = target
          .closest(".w-radio")
          ?.querySelector(wf.select.radio);
        if (selectedCustomRadio) {
          selectedCustomRadio.classList.add(wf.class.checked);
        }
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
            customElement.classList.add(focusClass);
            if (target.matches(focusVisibleSelector)) {
              customElement.classList.add(focusVisibleClass);
            }
          }
        });

        input.addEventListener("blur", (event) => {
          const target = event.target as HTMLInputElement;
          const customElement = target
            .closest(".w-checkbox, .w-radio")
            ?.querySelector(customClass);
          if (customElement) {
            customElement.classList.remove(focusClass, focusVisibleClass);
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

  const removeErrorClasses = () => {
    input.classList.remove("has-error");
    if (isCheckboxInput(input)) {
      input.parentElement?.querySelector(wf.select.checkbox)?.classList.remove("has-error");
    }
  };

  if (input.type !== "checkbox" && input.type !== "radio") {
    input.addEventListener("input", () => removeErrorClasses(), { once: true });
  } else {
    input.addEventListener("change", () => removeErrorClasses(), { once: true });
  }
}

export function validateFields(
  inputs: NodeListOf<HTMLFormInput> | HTMLFormInput[],
  report: boolean = true
): {
  valid: boolean;
  invalidField: HTMLFormInput | null;
} {
  let valid = true; // Assume the step is valid unless we find a problem
  let firstInvalidField: HTMLFormInput | null = null;

  for (const input of Array.from(inputs)) {
    if (!input.checkValidity()) {
      valid = false;
      if (report && !firstInvalidField) {
        reportValidity(input);
        firstInvalidField = input; // Store the first invalid field
      }
      break;
    } else {
      input.classList.remove("has-error");
    }
  }

  return { valid, invalidField: firstInvalidField };
}

export function disableWebflowForm(form: HTMLFormElement): void {
  form?.classList.remove("w-form");
  form.parentElement.classList.remove("w-form");
}

export {
  formElementSelector,
  filterFormSelector,
}

export type { HTMLFormInput, FormComponentElement, CustomValidator };
