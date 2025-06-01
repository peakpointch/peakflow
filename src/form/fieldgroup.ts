import { FormField } from "./formfield";

/**
 * A map of string to a `FormField` class instance.
 */
export type FormFieldMap<FieldId extends string = string> = Map<FieldId, FormField>;

export class FieldGroup<FieldId extends string = string> {
  public fields: FormFieldMap<FieldId>;

  constructor(fields: FormFieldMap<FieldId> = new Map()) {
    this.fields = fields;
  }

  /**
   * Finds a specific `FormField` instance by id.
   *
   * @param fieldId The id attribute of the associated DOM element.
   */
  public getField(fieldId: FieldId): FormField | undefined {
    return this.fields.get(fieldId);
  }
}

