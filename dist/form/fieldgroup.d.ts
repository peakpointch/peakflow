import { FormField } from "./formfield.js";
import type { FieldData } from "./formfield.js";
import type { HTMLFormInput } from "./utility.js";
export type FieldGroupValidation<FieldType extends FormField | HTMLFormInput = HTMLFormInput> = {
    isValid: boolean;
    invalidFields: FieldType[];
};
/**
 * A map of string to a `FormField` class instance.
 */
export type FormFieldMap<FieldId extends string = string> = Map<FieldId, FormField>;
export type SerializedFieldGroup = Record<string, FieldData>;
export declare class FieldGroup<FieldId extends string = string> {
    fields: FormFieldMap<FieldId>;
    validation: FieldGroupValidation<FormField>;
    constructor(fields?: FormFieldMap<FieldId>);
    /**
     * Finds a specific `FormField` instance by id.
     *
     * @param fieldId The id attribute of the associated DOM element.
     */
    getField(fieldId: FieldId): FormField | undefined;
    validate(report?: boolean): FieldGroupValidation<FormField>;
    /**
     * Serialize this `FieldGroup`.
     *
     * @returns `this.fields` as an object
     */
    serialize(): SerializedFieldGroup;
    /**
     * Deserialize a `FieldGroup`.
     *
     * @returns A new `FieldGroup` instance
     */
    static deserialize(fieldGroupData: SerializedFieldGroup): FieldGroup;
}
