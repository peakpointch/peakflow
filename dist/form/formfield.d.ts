import type { HTMLFormInput } from "./utility.js";
interface FieldData {
    id: string;
    label: string;
    value: any;
    required?: boolean;
    type: string;
    checked?: boolean;
}
declare class FormField implements FieldData {
    id: string;
    label: string;
    value: any;
    required: boolean;
    type: string;
    checked: boolean;
    private listeners;
    constructor(data?: FieldData | null);
    setValue(newValue: any): void;
    onChange(callback: (value: any) => void): void;
    validate(report?: boolean): boolean;
    serialize(): FieldData;
}
declare function fieldFromInput(input: HTMLFormInput, index: string | number): FormField;
export type { FieldData };
export { FormField, fieldFromInput };
