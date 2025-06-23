import mapToObject from "../utils/maptoobject";
import { FormField } from "./formfield";
class FieldGroup {
  constructor(fields = /* @__PURE__ */ new Map()) {
    this.fields = fields;
  }
  /**
   * Finds a specific `FormField` instance by id.
   *
   * @param fieldId The id attribute of the associated DOM element.
   */
  getField(fieldId) {
    return this.fields.get(fieldId);
  }
  validate(report = true) {
    const invalidFields = [];
    for (const field of this.fields.values()) {
      if (field.validate(report)) continue;
      invalidFields.push(field);
    }
    this.validation = {
      isValid: invalidFields.length === 0,
      invalidFields
    };
    return this.validation;
  }
  /**
   * Serialize this `FieldGroup`.
   *
   * @returns `this.fields` as an object
   */
  serialize() {
    return mapToObject(this.fields);
  }
  /**
   * Deserialize a `FieldGroup`.
   *
   * @returns A new `FieldGroup` instance
   */
  static deserialize(fieldGroupData) {
    const fieldsMap = /* @__PURE__ */ new Map();
    Object.entries(fieldGroupData).forEach(([key, fieldData]) => {
      const field = new FormField(fieldData);
      fieldsMap.set(key, field);
    });
    return new FieldGroup(fieldsMap);
  }
}
export {
  FieldGroup
};
