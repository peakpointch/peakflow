import { HTMLFormInput } from "./utility";
interface FieldData {
    id: string;
    label: string;
    value: any;
    required?: boolean;
    type: string;
    checked?: boolean;
}
declare class FormField {
    id: string;
    label: string;
    value: any;
    required: boolean;
    type: string;
    checked: boolean;
    constructor(data?: FieldData | null);
    validate(report?: boolean): boolean;
}
declare function fieldFromInput(input: HTMLFormInput, index: string | number): FormField;
export type { FieldData };
export { FormField, fieldFromInput };
