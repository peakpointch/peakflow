import { asSuffix, capitalize, deepMerge } from "../../utils";
import wf from "../../webflow/index.js";
import { createAttribute, exclude } from "../../attributeselector";
import { FormArrayItem, type ItemConstructor, type SerializedItem } from "./item";
import {
  FormDecision,
  FormMessage,
  FormProgressManager,
  isCheckboxInput,
  isRadioInput,
  validateFields,
  removeErrorClasses,
  isFormInput,
  findFormInput,
  reportValidity,
  getRadioGroups,
  setChecked,
  fieldFromInput,
  type FormProgressComponent,
  type HTMLFormInput,
  type FieldGroupValidation,
} from "../index.js";
import Accordion from "../../accordion";
import SplitButton from "../../split-button";
import { Modal, AlertDialog } from "../../modal";
import type { ScrollPosition } from "../../scroll";
import { pluralize, type Pluralized } from "../../pluralize";

import semver from "semver";
import type { PartialDeep } from "type-fest";

type ArrayElement =
  | "component"
  | "list"
  | "template"
  | "add"
  | "edit"
  | "delete"
  | "save"
  | "draft"
  | "draft-badge"
  | "cancel"
  | "circle";

type SerializedFormArray = SerializedItem[];

type OnOpenCallback = (item?: FormArrayItem) => void;
type OnCloseCallback = () => void;
type OnSaveCallback = (data: FormProgressComponent<SerializedFormArray>) => void;

type ModalGroup<T extends string = string> = {
  isValid: boolean;
  element: HTMLElement;
  name: T;
};

interface ArrayAttributes {
  id: string;
  element: string;
  fieldGroup: string;
  linkFields: string;
  select: string;
}

interface FormArrayOptions<Item extends FormArrayItem> {
  /** Unique identifier of this array */
  id: string | number;

  /** Used to store progress of this component */
  formId: string;

  /**
   * Parent element of this array component.
   * Contains all required elements as descendants.
   */
  container: HTMLElement;

  /** Limit the number of items allowed */
  limit?: number;

  /** Progress Manager of the parent form */
  manager: FormProgressManager;

  /**
   * AlertDialog instance to confirm destructive actions.
   * If no AlertDialog is passed, destructive actions will be executed
   * without confirmation.
   */
  alertDialog?: AlertDialog;

  itemClass: ItemConstructor<Item>;

  grammar: {
    item: Pluralized;
    article: Pluralized;
  };
}

const ARRAY_STORAGE_VERSION = "1.0.0";

export class FormArray<Item extends FormArrayItem> {
  public static readonly attr: ArrayAttributes = {
    id: "data-form-array-id",
    element: "data-form-array-element",
    select: "data-form-array-select",
    fieldGroup: "data-field-group",
    linkFields: "data-link-fields",
  };

  public static readonly options: FormArrayOptions<FormArrayItem> = {
    id: "form-array",
    formId: "form",
    container: undefined,
    manager: undefined,
    limit: undefined,
    itemClass: undefined,
    grammar: {
      item: {
        singular: "Eintrag",
        plural: "Einträge",
      },
      article: {
        singular: "der",
        plural: "die",
      },
    },
  };

  public readonly attr: ArrayAttributes = FormArray.attr;
  public alertDialog: AlertDialog;
  public component: HTMLElement;
  public form: HTMLElement;
  public groups: ModalGroup[] = [];
  public initialized: boolean = false;
  public id: string;
  public items: Map<string, Item>;
  public modal: Modal;
  public modalElement: HTMLElement;
  public options: FormArrayOptions<Item>;
  public splitButton: SplitButton<"draft" | "save">;

  private Item: ItemConstructor<Item>;
  private list: HTMLElement;
  private template: HTMLElement;
  private formMessage: FormMessage;
  private addButton: HTMLElement;
  private cancelButtons: NodeListOf<HTMLButtonElement>;
  private modalInputs: NodeListOf<HTMLFormInput>;
  private accordionList: Accordion[] = [];
  private onOpenCallbacks: Map<string, OnOpenCallback> = new Map();
  private onCloseCallbacks: Map<string, OnCloseCallback> = new Map();
  private onSaveCallbacks: Map<string, OnSaveCallback> = new Map();

  private editingKey: string | null = null;
  private unsavedItem: Item | null = null;

  constructor(options: PartialDeep<FormArrayOptions<Item>>) {
    //@ts-ignore
    this.options = deepMerge(FormArray.options, options);
    this.id = this.options.id.toString();

    if (this.options.itemClass === undefined) {
      throw new Error(`Please pass an implementation of the FormArrayItem class.`);
    }

    this.Item = this.options.itemClass;
    this.items = new Map();

    this.form = this.options.container;
    this.component = FormArray.select("component", this.id);
    this.list = this.select("list");
    this.template = this.list.querySelector(this.selector("template"))!;
    this.addButton = this.select("add");
    this.formMessage = new FormMessage("FormArray", this.id);

    // Form Modal
    this.modalElement = Modal.select("component", this.id);
    this.modal = new Modal(this.modalElement, {
      animation: {
        type: "growIn",
        duration: 300,
      },
      bodyScroll: {
        lock: true,
        smooth: true,
      },
    });
    this.alertDialog = this.options.alertDialog;
    this.splitButton = new SplitButton(SplitButton.select("component", this.id));
    this.cancelButtons = this.selectAll<HTMLButtonElement>("cancel", true);
    // this.cancelButtons = this.modalElement.querySelectorAll<HTMLButtonElement>(
    //   this.selector("cancel"),
    // );
    this.modalInputs = this.modalElement.querySelectorAll(wf.select.formInput);

    // Get groups
    const groupElements = this.modalElement.querySelectorAll<HTMLElement>(
      `[${this.attr.fieldGroup}]`,
    );
    groupElements.forEach((groupEl) => {
      const groupName = groupEl.getAttribute(this.attr.fieldGroup)!;
      this.groups.push({
        isValid: false,
        element: groupEl,
        name: groupName,
      });
    });

    this.initialize();
  }

  private static attributeSelector = createAttribute<ArrayElement>(FormArray.attr.element);

  /**
   * Static selector
   */
  public static selector(element: ArrayElement, instance?: string): string {
    const base = FormArray.attributeSelector(element);
    const instanceSelector = instance ? `[${FormArray.attr.id}="${instance}"]` : "";

    return element === "component"
      ? `${base}${instanceSelector}`
      : `${base}${instanceSelector}, ${instanceSelector} ${base}`;
  }

  /**
   * Instance selector
   */
  public selector(element: ArrayElement, global = false): string {
    return global ? FormArray.selector(element, this.id) : FormArray.selector(element);
  }

  public static select<T extends Element = HTMLElement>(
    element: ArrayElement,
    instance?: string,
  ): T {
    return document.querySelector<T>(FormArray.selector(element, instance));
  }

  public static selectAll<T extends Element = HTMLElement>(
    element: ArrayElement,
    instance?: string,
  ): NodeListOf<T> {
    return document.querySelectorAll<T>(FormArray.selector(element, instance));
  }

  public select<T extends Element = HTMLElement>(
    element: ArrayElement,
    global: boolean = false,
  ): T {
    return global
      ? document.querySelector<T>(FormArray.selector(element, this.id))
      : this.component.querySelector<T>(FormArray.selector(element));
  }

  public selectAll<T extends Element = HTMLElement>(
    element: ArrayElement,
    global: boolean = false,
  ): NodeListOf<T> {
    return global
      ? document.querySelectorAll<T>(FormArray.selector(element, this.id))
      : this.component.querySelectorAll<T>(FormArray.selector(element));
  }

  public registerSelects(suffix?: string): void {
    // Get all select inputs
    const selectInputSelector = createAttribute(this.attr.select);
    const inputs = this.form.querySelectorAll<HTMLSelectElement>(
      selectInputSelector(this.id, { matchType: "whitespace" }),
    );

    this.onSave("update-select-values", () => {
      inputs.forEach((input) => {
        const options = Array.from(this.items.values()).map((item) => {
          return {
            label: item.getFullName() + asSuffix(input.dataset.suffix ?? suffix, " "),
            value: item.key,
          };
        });

        const selected = input.value;

        // Delete existing options coming from this component
        input.querySelectorAll(`[data-origin="${this.id}"]`).forEach((el) => el.remove());

        // Insert new options
        options.forEach((opt) => {
          const option = document.createElement("option");
          option.innerText = opt.label;
          option.value = opt.value;
          option.dataset.origin = this.id;
          input.appendChild(option);
        });

        // Restore previous value if possible
        if (this.items.has(selected)) {
          input.value = selected;
        } else {
          input.value = "";
        }
      });
    });
  }

  private initialize(): void {
    this.cancelButtons.forEach((button) => {
      button.addEventListener("click", () => this.discardChanges());
    });

    let keyboardFocused = false;
    this.modalInputs.forEach((input) => {
      input.addEventListener("keydown", (event: KeyboardEvent) => {
        if (!this.modal.opened) return;
        if (event.key === "Enter") {
          event.preventDefault();
          this.saveItemFromModal({ validate: true, report: true });
        }

        if (event.key === "Tab" || event.key === "ArrowDown" || event.key === "ArrowUp") {
          keyboardFocused = true;
        }
      });
      input.addEventListener("focusin", (event) => {
        if (!this.modal.opened) return;
        event.preventDefault();
        const accordionIndex = this.accordionIndexOf(input);
        const accordionInstance = this.accordionList[accordionIndex];
        if (!accordionInstance.isOpen) {
          this.toggleAccordion(accordionIndex);
        }

        let position: ScrollPosition = "nearest";
        if (keyboardFocused) {
          keyboardFocused = false;
          position = "center";
        }

        this.modal.scrollTo(input, {
          delay: 500,
          position: position,
        });
      });
      const group = this.getClosestGroup(input);
      input.addEventListener("input", () => {
        // Never report invalid fields on every 'input' event
        if (
          input.matches(FormDecision.selector("input")) ||
          input.matches(`[${this.attr.linkFields}] *`)
        )
          return;

        this.validateModalGroup(group);
        const valid = this.groups.every((group) => group.isValid === true);
        this.splitButton.setAction(valid ? "save" : "draft");
      });
    });

    this.splitButton.setActionHandler("save", () => {
      this.saveItemFromModal({ validate: true, report: true });
    });
    this.splitButton.setActionHandler("draft", () => {
      this.saveItemFromModal({ validate: false, report: false });
    });
    this.addButton.addEventListener("click", () => this.startNewItem());

    this.initializeLinkedFields();

    this.renderList();
    this.closeModal();

    this.initAccordions();
    this.initialized = true;
  }

  private initializeLinkedFields(): void {
    const links = this.modalElement.querySelectorAll<HTMLElement>(`[${this.attr.linkFields}]`);

    links.forEach((link) => {
      const checkbox: HTMLInputElement = link.querySelector(wf.select.checkboxInput);
      checkbox.addEventListener("change", () => {
        if (!this.initialized || !this.modal.opened) return;
        if (checkbox.checked) {
          this.linkFields(link);
        } else {
          this.unlinkFields(link);
        }
      });
    });
  }

  private linkFields(linkElement: HTMLElement): void {
    const checkbox: HTMLInputElement = linkElement.querySelector(wf.select.checkboxInput);
    checkbox.checked = true;

    const otherItem = this.getOtherItem();
    if (!otherItem) throw new Error(`Couldn't get otherItem.`);

    const inputIds = linkElement
      .getAttribute(this.attr.linkFields)
      ?.split(",")
      .map((id) => id.trim());

    if (inputIds.length === 0 || inputIds.some((id) => id === "")) {
      throw new Error(
        `Please specify the ids of the fields you want to link. Ensure no ids are an empty string.`,
      );
    }

    const fieldGroupElement = linkElement.closest(`[${this.attr.fieldGroup}]`);
    const fieldGroupName = fieldGroupElement?.getAttribute(this.attr.fieldGroup);
    const sourceFieldGroup = otherItem[fieldGroupName];

    inputIds.forEach((id) => {
      const input = fieldGroupElement.querySelector(`#${id}`);
      if (!input || !isFormInput(input)) {
        throw new TypeError(
          `FormArray "Item": The selected input for field-link is not a "HTMLFormInput"`,
        );
      }

      input.value = sourceFieldGroup.getField(id)?.value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  private unlinkFields(linkElement: HTMLElement): void {
    const checkbox: HTMLInputElement = linkElement.querySelector(wf.select.checkboxInput);
    checkbox.checked = false;

    const inputIds = linkElement
      .getAttribute(this.attr.linkFields)
      ?.split(",")
      .map((id) => id.trim());

    if (inputIds.length === 0 || inputIds.some((id) => id === "")) {
      throw new Error(
        `Please specify the ids of the fields you want to link. Ensure no ids are an empty string.`,
      );
    }

    const fieldGroupElement = linkElement.closest(`[${this.attr.fieldGroup}]`);

    inputIds.forEach((id) => {
      const input = fieldGroupElement.querySelector(`#${id}`);
      if (
        !input ||
        (!(input instanceof HTMLInputElement) &&
          !(input instanceof HTMLSelectElement) &&
          !(input instanceof HTMLTextAreaElement))
      ) {
        throw new TypeError(
          `FormArray "Item": The selected input for field-link is not a "HTMLFormInput"`,
        );
      }

      input.value = null;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  private unlinkAllItems(): void {
    this.items.forEach((item) => item.linkedFields.clear());
  }

  /**
   * Updates the values of the linked fields inside `target` with the ones from `source`.
   *
   * @param id The id of the group of the linked fields
   */
  private syncLinkedFields(id: string, source: Item, target: Item): void {
    if (!source || !target) throw new Error(`The source or target Item is not defined.`);

    const linkedFields = source.linkedFields.get(id);
    target.linkFields(id, linkedFields.group, linkedFields.fields);
    linkedFields.fields.forEach((fieldId) => {
      const sourceValue = source[linkedFields.group].getField(fieldId).value;
      target[linkedFields.group].getField(fieldId).setValue(sourceValue);
    });
  }

  /**
   * Sync all linked fields of `target` with the ones from `source`.
   */
  private syncLinkedFieldsAll(source: Item, target: Item): void {
    if (!source || !target) throw new Error(`The source or target Item is not defined.`);

    target.linkedFields.clear();
    Array.from(source.linkedFields.keys()).forEach((groupId) => {
      this.syncLinkedFields(groupId, source, target);
    });
  }

  private handleLinkedFieldsVisibility(): void {
    const length: number = this.unsavedItem === null ? this.items.size : this.items.size + 1;

    const links = this.modalElement.querySelectorAll<HTMLElement>(`[${this.attr.linkFields}]`);

    if (this.options.limit !== undefined && length !== 2) {
      links.forEach((link) => {
        link.style.display = "none";
      });
    } else {
      const otherItem = this.getOtherItem();
      if (!otherItem) throw new Error(`Couldn't get otherItem.`);
      links.forEach((link) => {
        this.setLiveText("other-prospect-full-name", otherItem.getFullName());
        link.style.removeProperty("display");
      });
    }
  }

  /**
   * Retrieves a `Item` instance from a given key or returns the provided `Item` directly.
   *
   * @param itemOrKeyOrIndex - Either the key of the item or the item object itself.
   * @returns {Item} The corresponding `Item` object.
   * @throws Error if the item with the given key is not found.
   */
  public getItem(itemOrKeyOrIndex: Item | string | number): Item {
    let item: Item;

    if (typeof itemOrKeyOrIndex === "string") {
      item = this.items.get(itemOrKeyOrIndex);
    } else if (typeof itemOrKeyOrIndex === "number") {
      item = Array.from(this.items.values())[itemOrKeyOrIndex];
    } else if (itemOrKeyOrIndex instanceof this.Item) {
      item = itemOrKeyOrIndex;
    }

    if (!item) {
      throw new Error(`Item not found: ${itemOrKeyOrIndex}`);
    }

    return item;
  }

  /**
   * Gets the `Item` currently being edited via the `editingKey` property.
   */
  public getEditingItem(): Item | undefined {
    if (this.editingKey === null) {
      return undefined;
    } else if (this.editingKey.startsWith("unsaved")) {
      return this.unsavedItem;
    } else {
      return this.items.get(this.editingKey);
    }
  }

  private getOtherItem(): Item | undefined {
    // TODO: Getting the item which is currently not being edited this way might not be accurate.
    // Update: is this done now @chatgpt?

    if (!this.editingKey) {
      throw new Error(`Can't get other item if no item is currently being edited.`);
    }

    const editingItem = this.getEditingItem();
    return Array.from(this.items.values()).find((item) => {
      return item.key !== editingItem.key;
    });
  }

  /**
   * Opens an alert dialog to confirm canceling the changes made to the current `Item`.
   */
  private async discardChanges(): Promise<void> {
    const lastSaved = this.getEditingItem();
    const currentState = this.extractData();

    if (this.Item.areEqual(lastSaved, currentState)) {
      this.unsavedItem = null;
      this.closeModal();
      return;
    }

    let confirmed: boolean;
    if (this.alertDialog) {
      confirmed = await this.alertDialog.confirm({
        title: `Möchten Sie die Änderungen verwerfen?`,
        paragraph: `Mit dieser Aktion gehen alle Änderungen für "${this.getEditingItem().getFullName()}" verworfen. Diese Aktion kann nicht rückgängig gemacht werden.`,
        cancel: "abbrechen",
        confirm: "Änderungen verwerfen",
      });
    } else confirmed = true;

    if (confirmed) {
      this.unsavedItem = null;
      this.closeModal();
    }
  }

  /**
   * Opens the modal form to start a new `Item`. Creates an unsaved item.
   */
  public startNewItem() {
    if (this.items.size === this.options.limit) {
      const itemName = pluralize(this.options.grammar.item, this.options.limit);
      this.formMessage.error(`Sie können nur max. ${this.options.limit} ${itemName} hinzufügen.`);
      this.formMessage.setTimedReset(5000);
      return;
    }
    this.clearModal();
    this.setLiveText("state", "Hinzufügen");
    this.setLiveText("full-name", "Neue Person");

    this.unsavedItem = this.extractData(true);
    this.editingKey = `unsaved-${this.unsavedItem.key}`;
    this.openModal();
  }

  private saveItemFromModal(opts?: { validate?: boolean; report?: boolean }): void {
    if (opts.validate ?? true) {
      const listValid = this.validateModal(opts.report ?? true);
      if (!listValid) {
        console.warn(`Couldn't save Item. Please fill in all the values correctly.`);
        return;
      }
    }

    const draft = !opts.validate;
    const item: Item = this.extractData(draft);
    const otherItem = this.getOtherItem();
    if (!otherItem) {
      this.unlinkAllItems();
    } else {
      this.syncLinkedFieldsAll(item, otherItem);
    }

    if (this.saveItem(item)) {
      this.unsavedItem = null;
      this.renderList();
      this.closeModal();
    }

    this.triggerOnSave();
  }

  private saveItem(item: Item): boolean {
    const itemName = pluralize(this.options.grammar.item, this.options.limit);
    const itemLimitError = new RangeError(
      `Sie können nur max. ${this.options.limit} ${itemName} hinzufügen.`,
    );

    if (!this.editingKey.startsWith("unsaved") && this.editingKey !== null) {
      if (this.items.size > this.options.limit) {
        throw itemLimitError;
      }
      // Update existing item
      item.key = this.editingKey;
      this.items.set(this.editingKey, item);
    } else {
      if (this.items.size >= this.options.limit) {
        throw itemLimitError;
      }
      // Add the new item
      this.items.set(item.key, item);
    }
    return true;
  }

  private setLiveText(
    element: string,
    string: string,
    container: HTMLElement = this.modalElement,
  ): boolean {
    const liveElements: NodeListOf<HTMLElement> = container.querySelectorAll(
      `[data-live-text="${element}"]`,
    );
    let valid = true;
    for (const element of Array.from(liveElements)) {
      if (!element) {
        valid = false;
        break;
      }
      element.innerText = string;
    }
    return valid;
  }

  private renderList() {
    this.list.innerHTML = ""; // Clear the current list
    this.list.dataset.length = this.items.size.toString();

    if (this.items.size) {
      this.items.forEach((item) => this.renderItem(item));
      this.formMessage.reset();
    } else {
      const itemName = pluralize(this.options.grammar.item, this.options.limit);
      this.formMessage.info(
        `Bitte fügen Sie die Mieter (max. ${this.options.limit} ${itemName}) hinzu.`,
        !this.initialized,
      );
    }
  }

  private renderItem(key: string): void;
  private renderItem(item: Item): void;
  private renderItem(itemOrKey: Item | string): void {
    const item = this.getItem(itemOrKey);
    const newElement: HTMLElement = this.template.cloneNode(true) as HTMLElement;
    const props = ["full-name", "phone", "email", "street", "zip", "city"];
    newElement.style.removeProperty("display");

    // Add event listeners for editing and deleting
    const editButton = newElement.querySelector(this.selector("edit"));
    const deleteButton = newElement.querySelector(this.selector("delete"));

    editButton!.addEventListener("click", () => this.editItem(item));
    deleteButton!.addEventListener("click", async () => await this.onDeleteItem(item));

    props.forEach((prop) => {
      if (prop === "full-name") {
        this.setLiveText(prop, item.getFullName(), newElement);
      } else {
        const currentField = item.personalData.getField(prop);
        if (!currentField) {
          console.error(`Render Item: A field for "${prop}" doesn't exist.`);
          return;
        }
        this.setLiveText(prop, currentField.value || currentField.label, newElement);
      }
    });

    const badge = newElement.querySelector(this.selector("draft-badge"));
    badge.classList.toggle("hide", !item.draft);

    this.list.appendChild(newElement);
  }

  public editItem(key: string): void;
  public editItem(item: Item): void;
  public editItem(itemOrKey: Item | string): void {
    const item = this.getItem(itemOrKey);
    this.setLiveText("state", "bearbeiten");
    this.setLiveText("full-name", item.getFullName() || "Neue Person");
    this.editingKey = item.key; // Set editing key
    this.populateModal(item);
    this.openModal();
  }

  private async onDeleteItem(key: string): Promise<void>;
  private async onDeleteItem(item: Item): Promise<void>;
  private async onDeleteItem(itemOrKey: Item | string): Promise<void> {
    const item = this.getItem(itemOrKey);
    let confirmed: boolean;

    if (this.alertDialog) {
      confirmed = await this.alertDialog.confirm({
        title: `Möchten Sie die Person "${item.getFullName()}" wirklich löschen?`,
        paragraph: `Mit dieser Aktion wird die Person "${item.getFullName()}" gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`,
        cancel: "Abbrechen",
        confirm: "Person löschen",
      });
    } else confirmed = true;

    if (confirmed) this.deleteItem(item);
  }

  private deleteItem(key: string): void;
  private deleteItem(item: Item): void;
  private deleteItem(itemOrKey: Item | string): void {
    const item = this.getItem(itemOrKey);
    this.items.delete(item.key); // Remove the Item from the map

    // Unlink all fields for all items.
    // Since there can only be 2 items total, and one was just deleted,
    // there are no other items left to link fields to.
    this.unlinkAllItems();
    this.renderList(); // Re-render the list
    this.closeModal();
    this.triggerOnSave();
  }

  public onOpen(name: string, callback: OnOpenCallback): void {
    this.onOpenCallbacks.set(name, callback);
  }

  public clearOnOpen(name: string): void {
    this.onOpenCallbacks.delete(name);
  }

  public triggerOnOpen(): void {
    const editingitem = this.getEditingItem();
    for (const callback of this.onOpenCallbacks.values()) {
      callback(editingitem);
    }
  }

  public onClose(name: string, callback: OnCloseCallback): void {
    this.onCloseCallbacks.set(name, callback);
  }

  public clearOnClose(name: string): void {
    this.onCloseCallbacks.delete(name);
  }

  public triggerOnClose(): void {
    for (const callback of this.onCloseCallbacks.values()) {
      callback();
    }
  }

  public onSave(name: string, callback: OnSaveCallback, initialize: boolean = false): void {
    this.onSaveCallbacks.set(name, callback);
    if (initialize) callback(this.getProgress());
  }

  public clearOnSave(name: string): void {
    this.onSaveCallbacks.delete(name);
  }

  public triggerOnSave(): void {
    const data = this.getProgress();
    for (const callback of this.onSaveCallbacks.values()) {
      callback(data);
    }
  }

  private populateModal(item: Item) {
    for (const [id] of item.linkedFields.entries()) {
      const linkElement = this.modalElement.querySelector<HTMLElement>(
        `[${this.attr.linkFields}][data-id="${id}"]`,
      );
      if (!linkElement) continue;
      const linkCheckbox = linkElement.querySelector<HTMLInputElement>(wf.select.checkboxInput);
      linkCheckbox.checked = true;
      linkCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
    }

    this.groups.forEach((group) => {
      const selector = exclude(wf.select.formInput, `[${this.attr.linkFields}] *`);
      const groupInputs = Array.from(group.element.querySelectorAll<HTMLFormInput>(selector));

      if (!item[group.name]) {
        throw new Error(`The group "${group.name}" doesn't exist.`);
      }

      const [radioInputs, otherInputs] = groupInputs.reduce(
        ([radios, other], input) => {
          input.type === "radio" ? radios.push(input as HTMLInputElement) : other.push(input);
          return [radios, other];
        },
        [[] as HTMLInputElement[], [] as HTMLFormInput[]],
      );

      otherInputs.forEach((input) => {
        // Get field
        const field = item[group.name].getField(input.id);

        if (!field) return;

        if (!isCheckboxInput(input)) {
          // For text inputs, trim and set the value
          input.value = field.value.trim();
        } else {
          setChecked(input, field.checked);
        }
      });

      const radioGroups = getRadioGroups(radioInputs);
      radioGroups.forEach((radioGroup) => {
        const field = item[group.name].getField(radioGroup.name);

        if (!field) {
          return;
        }

        radioGroup.inputs.forEach((radio) => {
          setChecked(radio, radio.value === field.value ? field.checked : false);
        });
      });
    });
  }

  public validate(): boolean {
    let valid = true;

    // Validate if there are any items in the array (check if the `items` map has any entries)
    if (this.items.size === 0) {
      console.warn("Bitte fügen Sie mindestens eine mietende Person hinzu.");
      this.formMessage.error(
        `Bitte fügen Sie mindestens eine ${this.options.grammar.item.singular} hinzu.`,
      );
      this.formMessage.setTimedReset(5000, () => {
        const itemName = pluralize(this.options.grammar.item, this.options.limit);
        this.formMessage.info(
          `Bitte fügen Sie die Mieter (max. ${this.options.limit} ${itemName}) hinzu.`,
          true,
        );
      });
      valid = false;
    } else {
      // Check if each Item in the items collection is valid
      this.items.forEach((item) => {
        if (item.draft) {
          console.warn(
            `${capitalize(this.options.grammar.article.singular)} ${this.options.grammar.item.singular} "${item.getFullName()}" ist als Entwurf gespeichert. Bitte finalisieren oder löschen Sie diese Person.`,
          );
          this.formMessage.error(
            `${capitalize(this.options.grammar.article.singular)} ${this.options.grammar.item.singular} "${item.getFullName()}" ist als Entwurf gespeichert. Bitte finalisieren oder löschen Sie diese Person.`,
          );

          this.formMessage.setTimedReset(8000);
          valid = false; // If any Item is invalid, set valid to false
        } else if (!item.validate()) {
          console.warn(`Bitte füllen Sie alle Pflichtfelder für "${item.getFullName()}" aus.`);
          this.formMessage.error(
            `Bitte füllen Sie alle Pflichtfelder für "${item.getFullName()}" aus.`,
          );

          this.formMessage.setTimedReset(7000);

          // setTimeout(() => {
          //   this.populateModal(item);
          //   this.openModal();
          //   this.validateModal();
          // }, 0);
          valid = false; // If any Item is invalid, set valid to false
        }
      });
    }

    return valid;
  }

  public validateModalGroup(group: ModalGroup): FieldGroupValidation {
    const groupInputs = group.element.querySelectorAll<HTMLFormInput>(wf.select.formInput);
    const validation = validateFields(groupInputs, false);

    const circle = group.element.querySelector(this.selector("circle"));
    if (!circle) console.warn(`Circle element not found inside group "${group.name}"`);
    if (validation.isValid) {
      circle.classList.add("is-valid");
    } else {
      circle.classList.remove("is-valid");
    }

    group.isValid = validation.isValid;

    return validation;
  }

  private validateModal(report: boolean = true): boolean {
    // return true; // Change this for dev
    let valid = true;
    const invalidFields: HTMLFormInput[] = [];

    this.groups.forEach((group) => {
      const groupValid = this.validateModalGroup(group);
      invalidFields.push(...groupValid.invalidFields);
      if (group.isValid) return;
      valid = false;
    });

    if (!valid && invalidFields.length && report && this.modal.opened) {
      this.reportInvalidField(invalidFields[0]);
    }
    return valid;
  }

  private async reportInvalidField(field: HTMLFormInput): Promise<void>;
  private async reportInvalidField(fieldId: string, groupName: string): Promise<void>;
  private async reportInvalidField(
    fieldOrId: HTMLFormInput | string,
    groupName?: string | undefined,
  ): Promise<void> {
    const input = this.getFormInput(fieldOrId, groupName);

    const accordionIndex = this.accordionIndexOf(input);
    if (accordionIndex !== -1) {
      let delay = 0;

      // Open the accordion containing the invalid field using the index
      const accordion = this.accordionList[accordionIndex];
      if (!accordion.isOpen) {
        this.openAccordion(accordionIndex);
        delay = 800;
      }

      await this.modal.scrollTo(input, {
        delay: delay,
        position: "center",
      });

      reportValidity(input);
    }
  }

  private clearModal() {
    this.setLiveText("state", "hinzufügen");
    this.setLiveText("full-name", "Neue Person");
    this.modalInputs.forEach((input) => {
      if (isRadioInput(input)) {
        setChecked(input, false);
      } else if (isCheckboxInput(input)) {
        input.checked = false;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      } else {
        input.value = "";
      }
      removeErrorClasses(input);
    });
  }

  public openModal(): void {
    // Live text for name
    const personalData = this.groups.find((group) => group.name === "personalData");
    const nameInputs: NodeListOf<HTMLFormElement> =
      personalData.element.querySelectorAll("#firstName, #lastName");
    nameInputs.forEach((input) => {
      input.addEventListener("input", () => {
        const editingItem = this.extractData(this.editingKey.startsWith("unsaved"));
        this.setLiveText("full-name", editingItem.getFullName() || "Neue Person");
      });
    });

    const valid = this.validateModal(false);
    this.splitButton.setAction(valid ? "save" : "draft");
    this.handleLinkedFieldsVisibility();
    this.openAccordion(0);
    this.triggerOnOpen();

    this.modal.open();
  }

  public async closeModal(): Promise<void> {
    await this.modal.close();
    if (this.initialized) {
      this.list.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    this.clearModal();
    this.triggerOnClose();
    this.editingKey = null;
  }

  private initAccordions(): void {
    const accordionElements: HTMLElement[] = Array.from(
      this.modalElement.querySelectorAll(`[data-animate="accordion"]`),
    );

    const accordionList: Accordion[] = accordionElements.reduce((acc, accordionEl) => {
      return [...acc, new Accordion(accordionEl)];
    }, []);

    this.accordionList = accordionList;
    this.initAccordionListeners();
  }

  private initAccordionListeners(): void {
    for (let i = 0; i < this.accordionList.length; i++) {
      const accordion = this.accordionList[i];
      accordion.component.dataset.index = i.toString();
      accordion.onClick(() => {
        this.toggleAccordion(i);
        if (!accordion.isOpen) return;
        setTimeout(() => {
          accordion.scrollIntoView(this.modal.select("modal"), 0);
        }, 500);
      });
    }
  }

  private toggleAccordion(index: number) {
    for (let i = 0; i < this.accordionList.length; i++) {
      const accordion = this.accordionList[i];
      if (i === index) {
        accordion.toggle();
      } else {
        accordion.close();
      }
    }
  }

  private openAccordion(index: number) {
    for (let i = 0; i < this.accordionList.length; i++) {
      const accordion = this.accordionList[i];
      if (i === index) {
        accordion.open();
      } else {
        accordion.close();
      }
    }
  }

  /**
   * Finds the index of the accordion that contains a specific field element.
   * This method traverses the DOM to locate the accordion that wraps the field
   * and returns its index in the `accordionList`.
   *
   * @param field - The form element (field) to search for within the accordions.
   * @returns The index of the accordion containing the field, or `-1` if no accordion contains the field.
   */
  private accordionIndexOf(field: HTMLFormInput): number {
    let parentElement: HTMLElement | null = field.closest('[data-animate="accordion"]');

    if (parentElement) {
      // Find the index of the accordion in the accordionList based on the component
      const accordionIndex = this.accordionList.findIndex(
        (accordion) => accordion.component === parentElement,
      );
      return accordionIndex !== -1 ? accordionIndex : -1; // Return the index or -1 if not found
    }

    return -1; // Return -1 if no accordion is found
  }

  public getClosestGroup(element: HTMLElement): ModalGroup {
    const groupEl: HTMLElement | null = element.closest(`[${this.attr.fieldGroup}]`);
    if (!groupEl) {
      throw new Error(`The given element is not part of a group element.`);
    }
    return this.groups.find((group) => group.element === groupEl);
  }

  private getGroupsByName(groupName: string): ModalGroup[] {
    return this.groups.filter((group) => group.name === groupName);
  }

  private getFormInput<T extends HTMLFormInput = HTMLFormInput>(field: T): T;
  private getFormInput<T extends HTMLFormInput = HTMLFormInput>(
    fieldId: string,
    groupName: string,
  ): T;
  private getFormInput<T extends HTMLFormInput = HTMLFormInput>(
    fieldOrId: T | string,
    groupName?: string | undefined,
  ): T;
  private getFormInput<T extends HTMLFormInput = HTMLFormInput>(
    fieldOrId: T | string,
    groupName?: string | undefined,
  ): T {
    if (isFormInput(fieldOrId)) {
      return fieldOrId as T;
    }
    const groups = this.getGroupsByName(groupName);
    const groupElements = groups.map((group) => group.element);
    return findFormInput<T>(groupElements, fieldOrId);
  }

  private extractData(draft: boolean = false): Item {
    const itemData = new this.Item({ draft: draft });

    this.groups.forEach((group) => {
      const selector = exclude(wf.select.formInput, `[${this.attr.linkFields}] *`);
      const groupInputs = group.element.querySelectorAll<HTMLFormInput>(selector);
      const linkElements = group.element.querySelectorAll<HTMLElement>(`[${this.attr.linkFields}]`);

      if (!itemData[group.name]) {
        throw new Error(`The group "${group.name}" doesn't exist.`);
      }

      groupInputs.forEach((input, index) => {
        const field = fieldFromInput(input, index);
        if (field.id) {
          itemData[group.name].fields.set(field.id, field);
        }
      });

      linkElements.forEach((linkElement) => {
        const linkCheckbox = linkElement.querySelector<HTMLInputElement>(wf.select.checkboxInput);

        const id = linkCheckbox.dataset.name;
        const fieldsToLink = linkElement.getAttribute(this.attr.linkFields);
        if (linkCheckbox.checked) {
          itemData.linkFields(id, group.name, fieldsToLink);
        }
      });
    });

    return itemData;
  }

  /**
   * Used to save the item to local storage.
   */
  public serialize(): SerializedFormArray {
    return Array.from(this.items.values()).map((item) => item.serialize());
  }

  /**
   * Save the progress to localStorage
   */
  public getProgress(): FormProgressComponent<SerializedFormArray> {
    return {
      id: `${this.options.id}`,
      version: ARRAY_STORAGE_VERSION,
      data: this.serialize(),
    };
  }

  /**
   * Load the saved progress from localStorage
   */
  public loadProgress(): void {
    // Check if there's any saved data in localStorage
    const form = this.options.manager.getForm(this.options.formId);
    const progress = form?.components.find(
      (comp) => comp.id === this.id,
    ) as FormProgressComponent<SerializedFormArray>;

    if (!form || !progress) {
      console.log(`FormArray "${this.id}": No saved form progress found.`);
      return;
    }

    try {
      if (!progress.version) {
        throw new Error(`Saved progress is missing version; outdated.`);
      }

      const cleanCurrentVersion = semver.clean(ARRAY_STORAGE_VERSION);
      const cleanSavedVersion = semver.clean(progress.version);

      if (!cleanCurrentVersion || !cleanSavedVersion) {
        throw new Error("Invalid semver version format.");
      }

      if (!semver.eq(cleanCurrentVersion, cleanSavedVersion)) {
        throw new Error(`Saved progress version "${progress.version}" is outdated.`);
      }

      // Loop through the serialized data and create `Item` instances
      for (const itemData of progress.data) {
        const item = this.Item.deserialize(itemData); // Deserialize the Item object
        this.items.set(item.key, item);
      }

      this.renderList();
      this.closeModal();
      console.log(`FormArray "${this.id}": Array progress loaded.`);
    } catch (e) {
      console.error(`FormArray "${this.id}": Error loading array progress:`, e);
    }
  }
}
