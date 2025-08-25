import { FormMessage } from "./formmessage.js";
import { HTMLFormInput, isCheckboxInput, isRadioInput } from "./utility.js";

class FormGroup {
  private form: HTMLFormElement;
  private container: HTMLElement;
  private groupNames: string[];
  private validationMessage: string;
  public formMessage: FormMessage;

  constructor(container: HTMLElement, groupNames: string[], validationMessage: string) {
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

    // Initialize the form group by setting up event listeners
    this.initialize();
  }

  private initialize(): void {
    const allFields = this.getAllGroupFields();

    allFields.forEach((field) => {
      field.addEventListener("change", () => this.formMessage.reset());
    });
  }

  private getGroupFields(groupName: string): NodeListOf<HTMLFormInput> {
    return this.container.querySelectorAll(`[data-form-group="${groupName}"]`);
  }

  private getAllGroupFields(): NodeListOf<HTMLFormInput> {
    const selectorList = this.groupNames.map((groupName) => {
      return `[data-form-group="${groupName}"]`;
    });
    let selector: string = selectorList.join(", ");
    return this.container.querySelectorAll(selector);
  }

  public validate(): boolean {
    console.log("VALIDATING FORM GROUPS: ", this.groupNames);

    // Validate the groups and get the result
    const anyGroupValid = this.checkGroupValidity();

    // Handle error messages based on validation result
    this.handleValidationMessages(anyGroupValid);
    console.log(anyGroupValid);

    return anyGroupValid;
  }

  private checkGroupValidity(): boolean {
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

  private updateRequiredAttributes(anyGroupValid: boolean): void {
    const allFields = this.getAllGroupFields();
    allFields.forEach((field) => {
      field.required = !anyGroupValid;
    });
    this.formMessage.reset();
  }

  private handleValidationMessages(anyGroupValid: boolean): void {
    if (!anyGroupValid) {
      this.formMessage.error();
    } else {
      this.formMessage.reset();
    }
  }
}
