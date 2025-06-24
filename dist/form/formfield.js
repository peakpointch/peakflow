import { isCheckboxInput, isRadioInput } from "./utility";
import { parameterize } from "../parameterize";
class FormField {
  constructor(data = null) {
    this.listeners = /* @__PURE__ */ new Set();
    if (!data) {
      return;
    }
    this.id = data.id || `field-${Math.random().toString(36).substring(2)}`;
    this.label = data.label || `Untitled`;
    this.value = data.value || "";
    this.required = data.required || false;
    this.type = data.type || "text";
    if (["radio", "checkbox"].includes(this.type)) {
      this.checked = data.checked || false;
    }
    if (this.type === "checkbox" && !this.checked) {
      this.value = "Nicht angew\xE4hlt";
    }
  }
  setValue(newValue) {
    this.value = newValue;
    this.listeners.forEach((callback) => callback(newValue));
  }
  onChange(callback) {
    this.listeners.add(callback);
  }
  validate(report = true) {
    let valid = true;
    if (this.required) {
      if (this.type === "radio" || this.type === "checkbox") {
        if (!this.checked) {
          valid = false;
        }
      } else {
        if (!this.value.trim()) {
          valid = false;
        }
      }
    }
    if (!valid && report) {
      console.warn(`Field "${this.label}" is invalid.`);
    }
    return valid;
  }
}
function fieldFromInput(input, index) {
  if (input.type === "radio" && !input.checked) {
    return new FormField();
  }
  const id = input.id || parameterize(input.dataset.name || `untitled ${index}`);
  const field = new FormField({
    id: isRadioInput(input) ? input.name : id,
    label: input.dataset.name || `Untitled ${index}`,
    value: input.value,
    required: input.required || false,
    type: input.type,
    checked: isCheckboxInput(input) || isRadioInput(input) ? input.checked : void 0
  });
  return field;
}
export {
  FormField,
  fieldFromInput
};
