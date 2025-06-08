import mapToObject from "../maptoobject";
import { FormField, FieldData } from "./formfield";

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

  public validate(report: boolean = true): boolean {
    for (const field of this.fields.values()) {
      if (field.validate(report)) continue;
      return false;
    }
    return true;
  }

  public getInvalidFields(): FormField[] {
    const invalid: FormField[] = [];

    for (const field of this.fields.values()) {
      if (field.validate(false)) continue;
      invalid.push(field);
    }

    return invalid;
  }

  /**
   * Serialize this `FieldGroup`.
   *
   * @returns `this.fields` as an object
   */
  public serialize(): any {
    return mapToObject(this.fields);
  }

  /**
   * Deserialize a `FieldGroup`.
   *
   * @returns A new `FieldGroup` instance
   */
  public static deserialize(fieldGroupData: any): FieldGroup {
    const fieldsMap = new Map<string, FormField>();
    Object.entries(fieldGroupData).forEach(([key, fieldData]) => {
      const field = new FormField(fieldData as FieldData);
      fieldsMap.set(key, field);
    });

    return new FieldGroup(fieldsMap); // Create a new FieldGroup with the fields
  }
}
