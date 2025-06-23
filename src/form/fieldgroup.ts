import mapToObject from "../utils/maptoobject";
import { FormField, FieldData } from "./formfield";
import { HTMLFormInput } from "./utility";

export type FieldGroupValidation<FieldType extends FormField | HTMLFormInput = HTMLFormInput> = {
  isValid: boolean;
  invalidFields: FieldType[];
};

/**
 * A map of string to a `FormField` class instance.
 */
export type FormFieldMap<FieldId extends string = string> = Map<FieldId, FormField>;

export class FieldGroup<FieldId extends string = string> {
  public fields: FormFieldMap<FieldId>;
  public validation: FieldGroupValidation<FormField>;

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

  public validate(report: boolean = true): FieldGroupValidation<FormField> {
    const invalidFields: FormField[] = [];

    for (const field of this.fields.values()) {
      if (field.validate(report)) continue;
      invalidFields.push(field);
    }

    this.validation = {
      isValid: invalidFields.length === 0,
      invalidFields: invalidFields,
    };

    return this.validation;
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
