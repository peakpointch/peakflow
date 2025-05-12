import { FormField } from "./formfield";
export declare class FieldGroup<Field extends string = string> {
    fields: Map<Field, FormField>;
    constructor(fields?: Map<Field, FormField>);
    /**
     * Finds a specific `FormField` instance by id.
     *
     * @param fieldId The id attribute of the associated DOM element.
     */
    getField(fieldId: Field): FormField | undefined;
}
