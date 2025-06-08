import createAttribute from "../attributeselector";
import wf from "../webflow";
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
function clearRadioGroup(container, name) {
  container.querySelectorAll(
    `${wf.select.radioInput}[name="${name}"]`
  ).forEach((radio) => {
    radio.checked = false;
    const customRadio = radio.closest(".w-radio")?.querySelector(wf.select.radio);
    if (customRadio) {
      customRadio.classList.remove(wf.class.checked);
    }
  });
}
function enforceButtonTypes(form) {
  if (!form) return;
  const buttons = form.querySelectorAll("button:not([type])");
  buttons.forEach((button) => button.setAttribute("type", "button"));
}
function initWfInputs(container) {
  const focusClass = "w--redirected-focus";
  const focusVisibleClass = "w--redirected-focus-visible";
  const focusVisibleSelector = ":focus-visible, [data-wf-focus-visible]";
  const inputTypes = [
    ["checkbox", wf.select.checkbox],
    ["radio", wf.select.radio]
  ];
  container.querySelectorAll(wf.select.checkboxInput).forEach((input) => {
    input.addEventListener("change", (event) => {
      const target = event.target;
      const customCheckbox = target.closest(".w-checkbox")?.querySelector(wf.select.checkbox);
      if (customCheckbox) {
        customCheckbox.classList.toggle(wf.class.checked, target.checked);
      }
    });
  });
  container.querySelectorAll('input[type="radio"]').forEach((input) => {
    input.addEventListener("change", (event) => {
      const target = event.target;
      if (!target.checked) return;
      const name = target.name;
      container.querySelectorAll(
        `input[type="radio"][name="${name}"]`
      ).forEach((radio) => {
        const customRadio = radio.closest(".w-radio")?.querySelector(wf.select.radio);
        if (customRadio) {
          customRadio.classList.remove(wf.class.checked);
        }
      });
      const selectedCustomRadio = target.closest(".w-radio")?.querySelector(wf.select.radio);
      if (selectedCustomRadio) {
        selectedCustomRadio.classList.add(wf.class.checked);
      }
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
          customElement.classList.add(focusClass);
          if (target.matches(focusVisibleSelector)) {
            customElement.classList.add(focusVisibleClass);
          }
        }
      });
      input.addEventListener("blur", (event) => {
        const target = event.target;
        const customElement = target.closest(".w-checkbox, .w-radio")?.querySelector(customClass);
        if (customElement) {
          customElement.classList.remove(focusClass, focusVisibleClass);
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
  getWfFormData,
  initWfInputs,
  isCheckboxInput,
  isFormInput,
  isRadioInput,
  removeErrorClasses,
  reportValidity,
  sendFormData,
  validateFields
};
