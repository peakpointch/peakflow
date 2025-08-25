import createAttribute from "../attributeselector/index.js";
import wf from "../webflow/index.js";
import { getAllElements } from "../utils/getelements.js";
// Form selector functions
const formElementSelector = createAttribute("data-form-element");
const filterFormSelector = createAttribute("data-filter-form");
/**
 * Check if a FormElement is a radio input.
 * @param {HTMLFormInput} input - The input that is to be checked.
 * @returns {boolean} True if the input is a radio button, otherwise false.
 */
export function isRadioInput(input) {
    return input instanceof HTMLInputElement && input.type === "radio";
}
/**
 * Check if a FormElement is a checkbox input.
 * @param {HTMLFormInput} input - The input that is to be checked.
 * @returns {boolean} True if the input is a checkbox, otherwise false.
 */
export function isCheckboxInput(input) {
    return input instanceof HTMLInputElement && input.type === "checkbox";
}
export function isFormInput(input) {
    return (input instanceof HTMLInputElement ||
        input instanceof HTMLSelectElement ||
        input instanceof HTMLTextAreaElement);
}
export function getRadioGroups(source, ...names) {
    let inputs;
    if (Array.isArray(source)) {
        inputs = source;
    }
    else if (source instanceof HTMLElement) {
        inputs = getAllElements(wf.select.formInput, {
            single: false,
            node: source,
        });
    }
    else {
        throw new Error(`Invalid first parameter: expected "string", "HTMLElement" or "HTMLFormInput[]".`);
    }
    if (!inputs || !inputs.length) {
        return [];
    }
    const radioGroupMap = inputs.reduce((acc, input) => {
        if (!isRadioInput(input))
            return acc;
        if (names.length && !names.includes(input.name))
            return acc;
        if (!acc.has(input.name)) {
            acc.set(input.name, { name: input.name, inputs: [] });
        }
        acc.get(input.name).inputs.push(input);
        return acc;
    }, new Map());
    return Array.from(radioGroupMap.values());
}
export function getRadioGroupStrict(source, name) {
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
    }
    else if (group.inputs.length === 1) {
        console.warn(`Radio group "${name}" has only 1 input.`);
    }
    return group;
}
export function getRadioGroup(source, name) {
    try {
        return getRadioGroupStrict(source, name);
    }
    catch (e) {
        console.warn(`Get radio group: ${e instanceof Error ? e.message : "Unknown error"}`);
        return null;
    }
}
export function findFormInput(containers, inputId, selectorPrefix = wf.select.formInput) {
    const selector = `${selectorPrefix}#${inputId}`;
    const matches = Array.from(containers).flatMap((container) => Array.from(container.querySelectorAll(selector)));
    if (matches.length === 0) {
        throw new Error(`No form input found with selector "${selector}".`);
    }
    if (matches.length > 1) {
        throw new Error(`Multiple form inputs found with selector "${selector}" - expected only one.`);
    }
    return matches[0];
}
export function findFormInputAll(containers, inputId, selectorPrefix = wf.select.formInput) {
    const selector = `${selectorPrefix}#${inputId}`;
    const matches = Array.from(containers).flatMap((container) => Array.from(container.querySelectorAll(selector)));
    return matches;
}
export function getWfFormData(form, fields, test = false) {
    if (!form || !(form instanceof HTMLFormElement)) {
        form = form?.querySelector("form");
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
export async function sendFormData(formData) {
    const url = `https://webflow.com/api/v1/form/${wf.siteId}`;
    const request = {
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
    }
    catch (error) {
        console.error("Form submission failed:", error);
        return false;
    }
}
export function clearRadioGroup(container, name, silent = false) {
    const radioGroup = getRadioGroup(container, name);
    radioGroup.inputs.forEach((radio) => {
        setChecked(radio, false, silent);
    });
}
export function setChecked(input, checked, silent = false) {
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
    if (silent)
        return;
    input.dispatchEvent(new Event("change", { bubbles: true }));
}
/**
 * Prevents unintended form submissions by setting missing <button> types to "button".
 */
export function enforceButtonTypes(form) {
    if (!form)
        return;
    const buttons = form.querySelectorAll("button:not([type])");
    buttons.forEach((button) => button.setAttribute("type", "button"));
}
/**
 * Initialize Webflow's native checkbox and radio elements.
 */
export function initWfInputs(container) {
    // Constants for selectors and classes
    const inputTypes = [
        ["checkbox", wf.select.checkbox],
        ["radio", wf.select.radio],
    ];
    // Add change event listener for checkboxes
    container.querySelectorAll(wf.select.checkboxInput).forEach((input) => {
        input.addEventListener("change", (event) => {
            const target = event.target;
            setChecked(target, target.checked, true);
        });
    });
    // Add change event listener for radio buttons
    container.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener("change", (event) => {
            const target = event.target;
            if (!target.checked)
                return;
            const radioGroup = getRadioGroup(container, target.name);
            radioGroup.inputs.forEach((radio) => {
                // Check the radio that was selected, uncheck all others in the group
                setChecked(radio, radio.value === target.value, true);
            });
        });
    });
    // Add focus and blur event listeners for checkboxes and radios
    inputTypes.forEach(([type, customClass]) => {
        container
            .querySelectorAll(`input[type="${type}"]:not(${customClass})`)
            .forEach((input) => {
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
export function reportValidity(input) {
    input.reportValidity();
    input.classList.add("has-error");
    if (isCheckboxInput(input)) {
        input.parentElement?.querySelector(wf.select.checkbox)?.classList.add("has-error");
    }
    if (input.type !== "checkbox" && input.type !== "radio") {
        input.addEventListener("input", () => removeErrorClasses(input), {
            once: true,
        });
    }
    else {
        input.addEventListener("change", () => removeErrorClasses(input), {
            once: true,
        });
    }
}
export function removeErrorClasses(input) {
    input.classList.remove("has-error");
    if (isCheckboxInput(input)) {
        input.parentElement?.querySelector(wf.select.checkbox)?.classList.remove("has-error");
    }
}
export function validateFields(inputs, report = true) {
    let isValid = true; // Assume the step is valid unless we find a problem
    let invalidFields = [];
    for (const input of Array.from(inputs)) {
        if (!input.checkValidity()) {
            invalidFields.push(input);
            isValid = false;
            if (report) {
                reportValidity(input);
            }
            break;
        }
        else {
            input.classList.remove("has-error");
        }
    }
    return { isValid, invalidFields };
}
export function disableWebflowForm(form) {
    form?.classList.remove("w-form");
    form.parentElement.classList.remove("w-form");
}
export { formElementSelector, filterFormSelector };
