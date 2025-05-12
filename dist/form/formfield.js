import { isCheckboxInput, isRadioInput } from "./utility";
import { parameterize } from "../parameterize";
class FormField {
    constructor(data = null) {
        if (!data) {
            return;
        }
        this.id = data.id || `field-${Math.random().toString(36).substring(2)}`; // Generating unique id if missing
        this.label = data.label || `Unnamed Field`;
        this.value = data.value || "";
        this.required = data.required || false;
        this.type = data.type || "text";
        if (this.type === "radio" || "checkbox") {
            this.checked = data.checked || false;
        }
        if (this.type === "checkbox" && !this.checked) {
            console.log(this.label, this.type, this.checked, data.checked);
            this.value = "Nicht angewählt";
        }
    }
    validate(report = true) {
        let valid = true;
        // If the field is required, check if it has a valid value
        if (this.required) {
            if (this.type === "radio" || this.type === "checkbox") {
                // For radio or checkbox, check if it is checked
                if (!this.checked) {
                    valid = false;
                }
            }
            else {
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
}
function fieldFromInput(input, index) {
    if (input.type === "radio" && !input.checked) {
        return new FormField();
    }
    const field = new FormField({
        id: input.id || parameterize(input.dataset.name || `field ${index}`),
        label: input.dataset.name || `field ${index}`,
        value: input.value,
        required: input.required || false,
        type: input.type,
        checked: isCheckboxInput(input) || isRadioInput(input) ? input.checked : undefined,
    });
    return field;
}
export { FormField, fieldFromInput };
