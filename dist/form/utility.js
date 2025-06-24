import createAttribute from "../attributeselector";
import wf from "../webflow";
import { getAllElements, getElement } from "src/utils/getelements";
const formElementSelector = createAttribute("data-form-element");
const filterFormSelector = createAttribute("data-filter-form");
function isRadioInput(input) {
  return input instanceof HTMLInputElement && input.type === "radio";
}
function isCheckboxInput(input) {
  return input instanceof HTMLInputElement && input.type === "checkbox";
}
function isFormInput(input) {
  return input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement;
}
function getRadioGroups(firstArg, name) {
  let inputs;
  if (Array.isArray(firstArg)) {
    inputs = firstArg;
  } else if (firstArg instanceof HTMLElement || typeof firstArg === "string") {
    const container = getElement(firstArg, { single: false });
    inputs = getAllElements(wf.select.formInput, { single: false, node: container });
  } else {
    throw new Error(`Invalid first parameter: expected "string", "HTMLElement" or "HTMLFormInput[]".`);
  }
  if (!inputs || !inputs.length) {
    throw new Error(`No form inputs found in the provided ${Array.isArray(firstArg) ? "array" : "container"}.`);
  }
  const radioGroupMap = inputs.reduce((acc, input) => {
    if (!isRadioInput(input)) return acc;
    if (name && input.name !== name) return acc;
    if (!acc.has(input.name)) {
      acc.set(input.name, { name: input.name, inputs: [] });
    }
    acc.get(input.name).inputs.push(input);
    return acc;
  }, /* @__PURE__ */ new Map());
  return Array.from(radioGroupMap.values());
}
function findFormInput(containers, inputId, selectorPrefix = wf.select.formInput) {
  const selector = `${selectorPrefix}#${inputId}`;
  const matches = Array.from(containers).flatMap(
    (container) => Array.from(container.querySelectorAll(selector))
  );
  if (matches.length === 0) {
    throw new Error(`No form input found with selector "${selector}".`);
  }
  if (matches.length > 1) {
    throw new Error(`Multiple form inputs found with selector "${selector}" - expected only one.`);
  }
  return matches[0];
}
function findFormInputAll(containers, inputId, selectorPrefix = wf.select.formInput) {
  const selector = `${selectorPrefix}#${inputId}`;
  const matches = Array.from(containers).flatMap(
    (container) => Array.from(container.querySelectorAll(selector))
  );
  return matches;
}
function getWfFormData(form, fields, test = false) {
  if (!(form instanceof HTMLFormElement)) {
    form = form.querySelector("form");
  }
  if (!form || !(form instanceof HTMLFormElement)) {
    throw new TypeError(`The passed "form" is not a form.`);
  }
  return {
    name: form.dataset.name,
    pageId: wf.pageId,
    elementId: form.dataset.wfElementId,
    source: window.location.href,
    fields,
    test,
    dolphin: false
  };
}
async function sendFormData(formData) {
  const url = `https://webflow.com/api/v1/form/${wf.siteId}`;
  const request = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/javascript, */*; q=0.01"
    },
    body: JSON.stringify(formData)
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
function clearRadioGroup(container, name, silent = false) {
  const radioGroup = getRadioGroups(container, name)[0];
  radioGroup.inputs.forEach((radio) => {
    setChecked(radio, false, silent);
  });
}
function setChecked(input, checked, silent = false) {
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
function enforceButtonTypes(form) {
  if (!form) return;
  const buttons = form.querySelectorAll("button:not([type])");
  buttons.forEach((button) => button.setAttribute("type", "button"));
}
function initWfInputs(container) {
  const inputTypes = [
    ["checkbox", wf.select.checkbox],
    ["radio", wf.select.radio]
  ];
  container.querySelectorAll(wf.select.checkboxInput).forEach((input) => {
    input.addEventListener("change", (event) => {
      const target = event.target;
      setChecked(target, target.checked, true);
    });
  });
  container.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      const target = event.target;
      if (!target.checked) return;
      const radioGroup = getRadioGroups(container, target.name)[0];
      radioGroup.inputs.forEach((radio) => {
        setChecked(radio, radio.value === target.value, true);
      });
    });
  });
  inputTypes.forEach(([type, customClass]) => {
    container.querySelectorAll(
      `input[type="${type}"]:not(${customClass})`
    ).forEach((input) => {
      input.addEventListener("focus", (event) => {
        const target = event.target;
        const customElement = target.closest(".w-checkbox, .w-radio")?.querySelector(customClass);
        if (customElement) {
          customElement.classList.add(wf.class.focus);
          if (target.matches(wf.select.focused)) {
            customElement.classList.add(wf.class.focusVisible);
          }
        }
      });
      input.addEventListener("blur", (event) => {
        const target = event.target;
        const customElement = target.closest(".w-checkbox, .w-radio")?.querySelector(customClass);
        if (customElement) {
          customElement.classList.remove(wf.class.focus, wf.class.focusVisible);
        }
      });
    });
  });
}
function reportValidity(input) {
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
function removeErrorClasses(input) {
  input.classList.remove("has-error");
  if (isCheckboxInput(input)) {
    input.parentElement?.querySelector(wf.select.checkbox)?.classList.remove("has-error");
  }
}
function validateFields(inputs, report = true) {
  let isValid = true;
  let invalidFields = [];
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
function disableWebflowForm(form) {
  form?.classList.remove("w-form");
  form.parentElement.classList.remove("w-form");
}
export {
  clearRadioGroup,
  disableWebflowForm,
  enforceButtonTypes,
  filterFormSelector,
  findFormInput,
  findFormInputAll,
  formElementSelector,
  getRadioGroups,
  getWfFormData,
  initWfInputs,
  isCheckboxInput,
  isFormInput,
  isRadioInput,
  removeErrorClasses,
  reportValidity,
  sendFormData,
  setChecked,
  validateFields
};
