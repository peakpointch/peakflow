import { WfFormData } from "../../types/webflow";
import { FieldGroupValidation } from "./fieldgroup";
/**
 * Represents any standard form input element <input>, <select>, or <textarea>.
 */
export type HTMLFormInput = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
export type CustomValidator = () => boolean;
export type FormComponentElement = 'component' | 'success' | 'error' | 'submit' | 'modal';
type FilterFormElement = 'component' | 'field';
declare const formElementSelector: import("../attributeselector").AttributeSelector<FormComponentElement>;
declare const filterFormSelector: import("../attributeselector").AttributeSelector<FilterFormElement>;
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
export declare function isFormInput(input: unknown): input is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
export declare function findFormInput<T extends HTMLFormInput = HTMLFormInput>(containers: Iterable<HTMLElement>, inputId: string, selectorPrefix?: string): T;
export declare function findFormInputAll<T extends HTMLFormInput = HTMLFormInput>(containers: Iterable<HTMLElement>, inputId: string, selectorPrefix?: string): T[];
export declare function getWfFormData(form: HTMLFormElement | HTMLElement, fields: any, test?: boolean): WfFormData;
/**
 * Submit any form data to a Webflow site.
 *
 * @param formData The data submitted to the Webflow form api endpoint.
 *     Make sure the formData is an object, ready for JSON.stringify()
 */
export declare function sendFormData(formData: any): Promise<boolean>;
export declare function clearRadioGroup(container: HTMLElement, name: string): void;
export declare function clearRadioInput(radio: HTMLInputElement): void;
/**
 * Prevents unintended form submissions by setting missing <button> types to "button".
 */
export declare function enforceButtonTypes(form: HTMLFormElement | null): void;
/**
 * Initialize Webflow's native checkbox and radio elements.
 */
export declare function initWfInputs(container: HTMLElement): void;
export declare function reportValidity(input: HTMLFormInput): void;
export declare function removeErrorClasses(input: HTMLFormInput): void;
export declare function validateFields(inputs: NodeListOf<HTMLFormInput> | HTMLFormInput[], report?: boolean): FieldGroupValidation;
export declare function disableWebflowForm(form: HTMLFormElement): void;
export { formElementSelector, filterFormSelector, };
