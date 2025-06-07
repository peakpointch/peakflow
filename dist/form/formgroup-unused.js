import { FormMessage } from "./formmessage";
import { isCheckboxInput, isRadioInput } from "./utility";
class FormGroup {
  constructor(container, groupNames, validationMessage) {
    this.container = container;
    this.groupNames = groupNames;
    this.validationMessage = validationMessage;
    const formElement = this.getAllGroupFields()[0].closest("form");
    if (!formElement) {
      console.error(`Cannot construct a FormGroup that is not part of a form.`);
      return;
    }
    this.form = formElement;
    this.formMessage = new FormMessage("FormGroup", this.groupNames.join(","));
    this.initialize();
  }
  initialize() {
    const allFields = this.getAllGroupFields();
    allFields.forEach((field) => {
      field.addEventListener("change", () => this.formMessage.reset());
    });
  }
  getGroupFields(groupName) {
    return this.container.querySelectorAll(`[data-form-group="${groupName}"]`);
  }
  getAllGroupFields() {
    const selectorList = this.groupNames.map((groupName) => {
      return `[data-form-group="${groupName}"]`;
    });
    let selector = selectorList.join(", ");
    return this.container.querySelectorAll(selector);
  }
  validate() {
    console.log("VALIDATING FORM GROUPS: ", this.groupNames);
    const anyGroupValid = this.checkGroupValidity();
    this.handleValidationMessages(anyGroupValid);
    console.log(anyGroupValid);
    return anyGroupValid;
  }
  checkGroupValidity() {
    return this.groupNames.some((groupName) => {
      const groupFields = Array.from(this.getGroupFields(groupName));
      return groupFields.some((field) => {
        if (isCheckboxInput(field) || isRadioInput(field)) {
          return field.checked;
        }
        return field.value.trim() !== "";
      });
    });
  }
  updateRequiredAttributes(anyGroupValid) {
    const allFields = this.getAllGroupFields();
    allFields.forEach((field) => {
      field.required = !anyGroupValid;
    });
    this.formMessage.reset();
  }
  handleValidationMessages(anyGroupValid) {
    if (!anyGroupValid) {
      this.formMessage.error();
    } else {
      this.formMessage.reset();
    }
  }
}
