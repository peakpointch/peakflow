import { isCheckboxInput, isRadioInput } from "./utility.js";
import type { HTMLFormInput } from "./utility.js";
import { parameterize } from "../utils/parameterize.js";

interface FieldData {
  id: string;
  label: string;
  value: any;
  required?: boolean;
  type: string;
  checked?: boolean;
}

class FormField implements FieldData {
  public id: string;
  public label: string;
  public value: any;
  public required: boolean;
  public type: string;
  public checked: boolean;
  private listeners: Set<(value: any) => void> = new Set();

  constructor(data: FieldData | null = null) {
    if (!data) {
      return;
    }

    this.id = data.id || `field-${Math.random().toString(36).substring(2)}`; // Generating unique id if missing
    this.label = data.label || `Untitled`;
    this.value = data.value || "";
    this.required = data.required || false;
    this.type = data.type || "text";

    if (["radio", "checkbox"].includes(this.type)) {
      this.checked = data.checked || false;
    }

    if (this.type === "checkbox" && !this.checked) {
      this.value = "Nicht angewählt";
    }
  }

  public setValue(newValue: any) {
    this.value = newValue;
    this.listeners.forEach((callback) => callback(newValue));
  }

  public onChange(callback: (value: any) => void) {
    this.listeners.add(callback);
  }

  public validate(report: boolean = true): boolean {
    let valid = true;

    // If the field is required, check if it has a valid value
    if (this.required) {
      if (this.type === "radio" || this.type === "checkbox") {
        // For radio or checkbox, check if it is checked
        if (!this.checked) {
          valid = false;
        }
      } else {
        // For other types, check if the value is not empty
        if (!this.value.trim()) {
          valid = false;
        }
      }
    }

    // If the field is not valid and reporting is enabled, log an error
    if (!valid && report) {
      console.warn(`Field "${this.label}" is invalid.`);
    }

    return valid;
  }

  public serialize(): FieldData {
    const serialized: FieldData = {
      id: this.id,
      label: this.label,
      value: this.value,
      required: this.required,
      type: this.type,
    };

    if (["radio", "checkbox"].includes(this.type)) {
      serialized.checked = this.checked;
    }

    return serialized;
  }
}

function fieldFromInput(
  input: HTMLFormInput,
  index: string | number,
): FormField {
  if (input.type === "radio" && !(input as HTMLInputElement).checked) {
    return new FormField();
  }

  const id =
    input.id || parameterize(input.dataset.name || `untitled ${index}`);

  const field = new FormField({
    id: isRadioInput(input) ? input.name : id,
    label: input.dataset.name || `Untitled ${index}`,
    value: input.value,
    required: input.required || false,
    type: input.type,
    checked:
      isCheckboxInput(input) || isRadioInput(input) ? input.checked : undefined,
  });

  return field;
}

export type { FieldData };
export { FormField, fieldFromInput };
