import { WfFormData } from "~/types/webflow";
type HTMLFormInput = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type CustomValidator = () => boolean;
type FormComponentElement = 'component' | 'success' | 'error' | 'submit' | 'modal';
type FilterFormElement = 'component' | 'field';
declare const formElementSelector: import("@library/attributeselector").AttributeSelector<FormComponentElement>;
declare const filterFormSelector: import("@library/attributeselector").AttributeSelector<FilterFormElement>;
/**
 * Check if a FormElement is a radio input.
 * @param {HTMLFormInput} input - The input that is to be checked.
 * @returns {boolean} True if the input is a radio button, otherwise false.
 */
export declare function isRadioInput(input: HTMLFormInput): input is HTMLInputElement;
/**
 * Check if a FormElement is a checkbox input.
 * @param {HTMLFormInput} input - The input that is to be checked.
 * @returns {boolean} True if the input is a checkbox, otherwise false.
 */
export declare function isCheckboxInput(input: HTMLFormInput): input is HTMLInputElement;
export declare function getWfFormData(form: HTMLFormElement | HTMLElement, fields: any, test?: boolean): WfFormData;
/**
 * Submit any form data to a Webflow site.
 *
 * @param formData The data submitted to the Webflow form api endpoint.
 *     Make sure the formData is an object, ready for JSON.stringify()
 */
export declare function sendFormData(formData: any): Promise<boolean>;
export declare function clearRadioGroup(container: HTMLElement, name: string): void;
export declare function initCustomInputs(container: HTMLElement): void;
export declare function reportValidity(input: HTMLFormInput): void;
export declare function validateFields(inputs: NodeListOf<HTMLFormInput> | HTMLFormInput[], report?: boolean): {
    valid: boolean;
    invalidField: HTMLFormInput | null;
};
export declare function disableWebflowForm(form: HTMLFormElement): void;
export { formElementSelector, filterFormSelector, };
export type { HTMLFormInput, FormComponentElement, CustomValidator };
