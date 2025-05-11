import { FormField } from "@library/form/formfield";

export class FieldGroup<Field extends string = string> {
  public fields: Map<Field, FormField>;

  constructor(fields: Map<Field, FormField> = new Map()) {
    this.fields = fields;
  }

  /**
   * Finds a specific `FormField` instance by id.
   *
   * @param fieldId The id attribute of the associated DOM element.
   */
  public getField(fieldId: Field): FormField | undefined {
    return this.fields.get(fieldId);
  }
}

