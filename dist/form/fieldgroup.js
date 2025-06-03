import mapToObject from "../maptoobject";
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
