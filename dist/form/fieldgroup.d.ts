import { FormField } from "./formfield";
/**
 * A map of string to a `FormField` class instance.
 */
export type FormFieldMap<FieldId extends string = string> = Map<FieldId, FormField>;
export declare class FieldGroup<FieldId extends string = string> {
    fields: FormFieldMap<FieldId>;
    constructor(fields?: FormFieldMap<FieldId>);
    /**
     * Finds a specific `FormField` instance by id.
     *
     * @param fieldId The id attribute of the associated DOM element.
     */
    getField(fieldId: FieldId): FormField | undefined;
    validate(report?: boolean): {
        isValid: boolean;
        invalidFields: FormField[];
    };
    /**
     * Serialize this `FieldGroup`.
     *
     * @returns `this.fields` as an object
     */
    serialize(): any;
    /**
     * Deserialize a `FieldGroup`.
     *
     * @returns A new `FieldGroup` instance
     */
    static deserialize(fieldGroupData: any): FieldGroup;
}
