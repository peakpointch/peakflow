import { asSuffix, capitalize } from "../../utils";
import wf from "../../webflow/index.js";
import { Selector, exclude } from "../../attributeselector";
import { BaseComponent } from "../../base-component/index.js";
import { FormArrayItem } from "./item";
import { FormDecision, FormMessage, FormProgressManager, isCheckboxInput, isRadioInput, validateFields, removeErrorClasses, isFormInput, findFormInput, reportValidity, getRadioGroups, setChecked, fieldFromInput, } from "../index.js";
import Accordion from "../../accordion";
import SplitButton from "../../split-button";
import { Modal, AlertDialog } from "../../modal";
import { pluralize } from "../../pluralize";
import semver from "semver";
const ARRAY_STORAGE_VERSION = "1.0.0";
export class FormArray extends BaseComponent {
    constructor(settings) {
        super(FormArray.select("component", settings.id), settings);
        this.attr = FormArray.attr;
        this.groups = [];
        this.initialized = false;
        this.accordionList = [];
        this.onOpenCallbacks = new Map();
        this.onCloseCallbacks = new Map();
        this.onSaveCallbacks = new Map();
        this.editingKey = null;
        this.unsavedItem = null;
        if (this.settings.itemClass === undefined) {
            throw new Error(`Please pass an implementation of the FormArrayItem class.`);
        }
        this.Item = this.settings.itemClass;
        this.items = new Map();
        this.form = this.settings.container;
        this.component = FormArray.select("component", this.id);
        this.list = this.select("list");
        this.template = this.list.querySelector(this.selector("template"));
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
        this.alertDialog = this.settings.alertDialog;
        this.splitButton = new SplitButton(SplitButton.select("component", this.id));
        this.cancelButtons = this.selectAll("cancel", true);
        // this.cancelButtons = this.modalElement.querySelectorAll<HTMLButtonElement>(
        //   this.selector("cancel"),
        // );
        this.modalInputs = this.modalElement.querySelectorAll(wf.select.formInput);
        // Get groups
        const groupElements = this.modalElement.querySelectorAll(`[${this.attr.fieldGroup}]`);
        groupElements.forEach((groupEl) => {
            const groupName = groupEl.getAttribute(this.attr.fieldGroup);
            this.groups.push({
                isValid: false,
                element: groupEl,
                name: groupName,
            });
        });
        this.initialize();
    }
    /**
     * Static selector
     */
    static selector(element, instance) {
        const base = FormArray.attributeSelector(element);
        const instanceSelector = instance ? `[${FormArray.attr.id}="${instance}"]` : "";
        return element === "component"
            ? `${base}${instanceSelector}`
            : `${base}${instanceSelector}, ${instanceSelector} ${base}`;
    }
    /**
     * Instance selector
     */
    selector(element, global = false) {
        return global ? FormArray.selector(element, this.id) : FormArray.selector(element);
    }
    static select(element, instance) {
        return document.querySelector(FormArray.selector(element, instance));
    }
    static selectAll(element, instance) {
        return document.querySelectorAll(FormArray.selector(element, instance));
    }
    select(element, global = false) {
        return global
            ? document.querySelector(FormArray.selector(element, this.id))
            : this.component.querySelector(FormArray.selector(element));
    }
    selectAll(element, global = false) {
        return global
            ? document.querySelectorAll(FormArray.selector(element, this.id))
            : this.component.querySelectorAll(FormArray.selector(element));
    }
    registerSelects(suffix) {
        // Get all select inputs
        const selectInputSelector = Selector.attr(this.attr.select);
        const inputs = this.form.querySelectorAll(selectInputSelector(this.id, { matchType: "whitespace" }));
        this.onSave("update-select-values", () => {
            inputs.forEach((input) => {
                const options = Array.from(this.items.values()).map((item) => {
                    return {
                        label: item.getFullName() + asSuffix(input.dataset.suffix ?? suffix, " "),
                        value: item.key,
                    };
                });
                const prevOption = input.options[input.selectedIndex];
                const prevOrigin = prevOption?.dataset.origin;
                const prevValue = prevOption?.value ?? "";
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
                if (prevOrigin !== this.id || this.items.has(prevValue)) {
                    input.value = prevValue;
                }
                else {
                    input.value = "";
                }
            });
        });
    }
    initialize() {
        this.cancelButtons.forEach((button) => {
            button.addEventListener("click", () => this.discardChanges());
        });
        let keyboardFocused = false;
        this.modalInputs.forEach((input) => {
            input.addEventListener("keydown", (event) => {
                if (!this.modal.opened)
                    return;
                if (event.key === "Enter") {
                    event.preventDefault();
                    this.saveItemFromModal({ validate: true, report: true });
                }
                if (event.key === "Tab" || event.key === "ArrowDown" || event.key === "ArrowUp") {
                    keyboardFocused = true;
                }
            });
            input.addEventListener("focusin", (event) => {
                if (!this.modal.opened)
                    return;
                event.preventDefault();
                const accordionIndex = this.accordionIndexOf(input);
                const accordionInstance = this.accordionList[accordionIndex];
                if (!accordionInstance.isOpen) {
                    this.toggleAccordion(accordionIndex);
                }
                let position = "nearest";
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
                if (input.matches(FormDecision.selector("input")) ||
                    input.matches(`[${this.attr.linkFields}] *`))
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
    initializeLinkedFields() {
        const links = this.modalElement.querySelectorAll(`[${this.attr.linkFields}]`);
        links.forEach((link) => {
            const checkbox = link.querySelector(wf.select.checkboxInput);
            checkbox.addEventListener("change", () => {
                if (!this.initialized || !this.modal.opened)
                    return;
                if (checkbox.checked) {
                    this.linkFields(link);
                }
                else {
                    this.unlinkFields(link);
                }
            });
        });
    }
    linkFields(linkElement) {
        const checkbox = linkElement.querySelector(wf.select.checkboxInput);
        checkbox.checked = true;
        const otherItem = this.getOtherItem();
        if (!otherItem)
            throw new Error(`Couldn't get otherItem.`);
        const inputIds = linkElement
            .getAttribute(this.attr.linkFields)
            ?.split(",")
            .map((id) => id.trim());
        if (inputIds.length === 0 || inputIds.some((id) => id === "")) {
            throw new Error(`Please specify the ids of the fields you want to link. Ensure no ids are an empty string.`);
        }
        const fieldGroupElement = linkElement.closest(`[${this.attr.fieldGroup}]`);
        const fieldGroupName = fieldGroupElement?.getAttribute(this.attr.fieldGroup);
        const sourceFieldGroup = otherItem[fieldGroupName];
        inputIds.forEach((id) => {
            const input = fieldGroupElement.querySelector(`#${id}`);
            if (!input || !isFormInput(input)) {
                throw new TypeError(`FormArray "Item": The selected input for field-link is not a "HTMLFormInput"`);
            }
            input.value = sourceFieldGroup.getField(id)?.value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }
    unlinkFields(linkElement) {
        const checkbox = linkElement.querySelector(wf.select.checkboxInput);
        checkbox.checked = false;
        const inputIds = linkElement
            .getAttribute(this.attr.linkFields)
            ?.split(",")
            .map((id) => id.trim());
        if (inputIds.length === 0 || inputIds.some((id) => id === "")) {
            throw new Error(`Please specify the ids of the fields you want to link. Ensure no ids are an empty string.`);
        }
        const fieldGroupElement = linkElement.closest(`[${this.attr.fieldGroup}]`);
        inputIds.forEach((id) => {
            const input = fieldGroupElement.querySelector(`#${id}`);
            if (!input ||
                (!(input instanceof HTMLInputElement) &&
                    !(input instanceof HTMLSelectElement) &&
                    !(input instanceof HTMLTextAreaElement))) {
                throw new TypeError(`FormArray "Item": The selected input for field-link is not a "HTMLFormInput"`);
            }
            input.value = null;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    }
    unlinkAllItems() {
        this.items.forEach((item) => item.linkedFields.clear());
    }
    /**
     * Updates the values of the linked fields inside `target` with the ones from `source`.
     *
     * @param id The id of the group of the linked fields
     */
    syncLinkedFields(id, source, target) {
        if (!source || !target)
            throw new Error(`The source or target Item is not defined.`);
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
    syncLinkedFieldsAll(source, target) {
        if (!source || !target)
            throw new Error(`The source or target Item is not defined.`);
        target.linkedFields.clear();
        Array.from(source.linkedFields.keys()).forEach((groupId) => {
            this.syncLinkedFields(groupId, source, target);
        });
    }
    handleLinkedFieldsVisibility() {
        const length = this.unsavedItem === null ? this.items.size : this.items.size + 1;
        const links = this.modalElement.querySelectorAll(`[${this.attr.linkFields}]`);
        if (this.settings.limit !== undefined && length !== 2) {
            links.forEach((link) => {
                link.style.display = "none";
            });
        }
        else {
            const otherItem = this.getOtherItem();
            if (!otherItem)
                throw new Error(`Couldn't get otherItem.`);
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
    getItem(itemOrKeyOrIndex) {
        let item;
        if (typeof itemOrKeyOrIndex === "string") {
            item = this.items.get(itemOrKeyOrIndex);
        }
        else if (typeof itemOrKeyOrIndex === "number") {
            item = Array.from(this.items.values())[itemOrKeyOrIndex];
        }
        else if (itemOrKeyOrIndex instanceof this.Item) {
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
    getEditingItem() {
        if (this.editingKey === null) {
            return undefined;
        }
        else if (this.editingKey.startsWith("unsaved")) {
            return this.unsavedItem;
        }
        else {
            return this.items.get(this.editingKey);
        }
    }
    getOtherItem() {
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
    async discardChanges() {
        const lastSaved = this.getEditingItem();
        const currentState = this.extractData();
        if (this.Item.areEqual(lastSaved, currentState)) {
            this.unsavedItem = null;
            this.closeModal();
            return;
        }
        let confirmed;
        if (this.alertDialog) {
            const dialog = this.getDialog("discard", this.getEditingItem());
            confirmed = await this.alertDialog.confirm(dialog);
        }
        else
            confirmed = true;
        if (confirmed) {
            this.unsavedItem = null;
            this.closeModal();
        }
    }
    /**
     * Opens the modal form to start a new `Item`. Creates an unsaved item.
     */
    startNewItem() {
        if (this.items.size === this.settings.limit) {
            const msg = this.getMessage("limit");
            this.formMessage.error(msg);
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
    saveItemFromModal(opts) {
        if (opts.validate ?? true) {
            const listValid = this.validateModal(opts.report ?? true);
            if (!listValid) {
                console.warn(`Couldn't save Item. Please fill in all the values correctly.`);
                return;
            }
        }
        const draft = !opts.validate;
        const item = this.extractData(draft);
        const otherItem = this.getOtherItem();
        if (!otherItem) {
            this.unlinkAllItems();
        }
        else {
            this.syncLinkedFieldsAll(item, otherItem);
        }
        if (this.saveItem(item)) {
            this.unsavedItem = null;
            this.renderList();
            this.closeModal();
        }
        this.triggerOnSave();
    }
    saveItem(item) {
        const itemName = pluralize(this.settings.grammar.item, this.settings.limit);
        const itemLimitError = new RangeError(`Sie können nur max. ${this.settings.limit} ${itemName} hinzufügen.`);
        if (!this.editingKey.startsWith("unsaved") && this.editingKey !== null) {
            if (this.items.size > this.settings.limit) {
                throw itemLimitError;
            }
            // Update existing item
            item.key = this.editingKey;
            this.items.set(this.editingKey, item);
        }
        else {
            if (this.items.size >= this.settings.limit) {
                throw itemLimitError;
            }
            // Add the new item
            this.items.set(item.key, item);
        }
        return true;
    }
    setLiveText(element, string, container = this.modalElement) {
        const liveElements = container.querySelectorAll(`[data-live-text="${element}"]`);
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
    renderList() {
        this.list.innerHTML = ""; // Clear the current list
        this.list.dataset.length = this.items.size.toString();
        if (this.items.size) {
            this.items.forEach((item) => this.renderItem(item));
            this.formMessage.reset();
        }
        else {
            const msg = this.getMessage("empty");
            this.formMessage.info(msg, !this.initialized);
        }
    }
    renderItem(itemOrKey) {
        const item = this.getItem(itemOrKey);
        const newElement = this.template.cloneNode(true);
        const props = ["full-name", "phone", "email", "street", "zip", "city"];
        newElement.style.removeProperty("display");
        // Add event listeners for editing and deleting
        const editButton = newElement.querySelector(this.selector("edit"));
        const deleteButton = newElement.querySelector(this.selector("delete"));
        editButton.addEventListener("click", () => this.editItem(item));
        deleteButton.addEventListener("click", async () => await this.onDeleteItem(item));
        props.forEach((prop) => {
            if (prop === "full-name") {
                this.setLiveText(prop, item.getFullName(), newElement);
            }
            else {
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
    editItem(itemOrKey) {
        const item = this.getItem(itemOrKey);
        this.setLiveText("state", "bearbeiten");
        this.setLiveText("full-name", item.getFullName() || "Neue Person");
        this.editingKey = item.key; // Set editing key
        this.populateModal(item);
        this.openModal();
    }
    async onDeleteItem(itemOrKey) {
        const item = this.getItem(itemOrKey);
        let confirmed;
        if (this.alertDialog) {
            const dialog = this.getDialog("delete", item);
            confirmed = await this.alertDialog.confirm(dialog);
        }
        else
            confirmed = true;
        if (confirmed)
            this.deleteItem(item);
    }
    deleteItem(itemOrKey) {
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
    onOpen(name, callback) {
        this.onOpenCallbacks.set(name, callback);
    }
    clearOnOpen(name) {
        this.onOpenCallbacks.delete(name);
    }
    triggerOnOpen() {
        const editingitem = this.getEditingItem();
        for (const callback of this.onOpenCallbacks.values()) {
            callback(editingitem);
        }
    }
    onClose(name, callback) {
        this.onCloseCallbacks.set(name, callback);
    }
    clearOnClose(name) {
        this.onCloseCallbacks.delete(name);
    }
    triggerOnClose() {
        for (const callback of this.onCloseCallbacks.values()) {
            callback();
        }
    }
    onSave(name, callback, initialize = false) {
        this.onSaveCallbacks.set(name, callback);
        if (initialize)
            callback(this.getProgress());
    }
    clearOnSave(name) {
        this.onSaveCallbacks.delete(name);
    }
    triggerOnSave() {
        const data = this.getProgress();
        for (const callback of this.onSaveCallbacks.values()) {
            callback(data);
        }
    }
    populateModal(item) {
        for (const [id] of item.linkedFields.entries()) {
            const linkElement = this.modalElement.querySelector(`[${this.attr.linkFields}][data-id="${id}"]`);
            if (!linkElement)
                continue;
            const linkCheckbox = linkElement.querySelector(wf.select.checkboxInput);
            linkCheckbox.checked = true;
            linkCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
        }
        this.groups.forEach((group) => {
            const selector = exclude(wf.select.formInput, `[${this.attr.linkFields}] *`);
            const groupInputs = Array.from(group.element.querySelectorAll(selector));
            if (!item[group.name]) {
                throw new Error(`The group "${group.name}" doesn't exist.`);
            }
            const [radioInputs, otherInputs] = groupInputs.reduce(([radios, other], input) => {
                input.type === "radio" ? radios.push(input) : other.push(input);
                return [radios, other];
            }, [[], []]);
            otherInputs.forEach((input) => {
                // Get field
                const field = item[group.name].getField(input.id);
                if (!field)
                    return;
                if (!isCheckboxInput(input)) {
                    // For text inputs, trim and set the value
                    input.value = field.value.trim();
                }
                else {
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
    validate() {
        let valid = true;
        // Validate if there are any items in the array (check if the `items` map has any entries)
        if (this.items.size === 0) {
            const msg = this.getMessage("empty", {});
            if (msg) {
                this.formMessage.error(msg);
                this.formMessage.setTimedReset(5000);
                this.formMessage.setTimedReset(5000, () => {
                    this.formMessage.info(msg, true);
                });
            }
            valid = false;
        }
        else {
            // Check if each Item in the items collection is valid
            this.items.forEach((item) => {
                if (item.draft) {
                    const msg = this.getMessage("draft", { item });
                    this.formMessage.error(msg);
                    this.formMessage.setTimedReset(8000);
                    valid = false; // If any Item is invalid, set valid to false
                }
                else if (!item.validate()) {
                    const msg = this.getMessage("invalid", { item });
                    this.formMessage.error(msg);
                    this.formMessage.setTimedReset(7000);
                    valid = false; // If any Item is invalid, set valid to false
                }
            });
        }
        return valid;
    }
    validateModalGroup(group) {
        const groupInputs = group.element.querySelectorAll(wf.select.formInput);
        const validation = validateFields(groupInputs, false);
        const circle = group.element.querySelector(this.selector("circle"));
        if (!circle)
            console.warn(`Circle element not found inside group "${group.name}"`);
        if (validation.isValid) {
            circle.classList.add("is-valid");
        }
        else {
            circle.classList.remove("is-valid");
        }
        group.isValid = validation.isValid;
        return validation;
    }
    validateModal(report = true) {
        // return true; // Change this for dev
        let valid = true;
        const invalidFields = [];
        this.groups.forEach((group) => {
            const groupValid = this.validateModalGroup(group);
            invalidFields.push(...groupValid.invalidFields);
            if (group.isValid)
                return;
            valid = false;
        });
        if (!valid && invalidFields.length && report && this.modal.opened) {
            this.reportInvalidField(invalidFields[0]);
        }
        return valid;
    }
    async reportInvalidField(fieldOrId, groupName) {
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
    clearModal() {
        this.setLiveText("state", "hinzufügen");
        this.setLiveText("full-name", "Neue Person");
        this.modalInputs.forEach((input) => {
            if (isRadioInput(input)) {
                setChecked(input, false);
            }
            else if (isCheckboxInput(input)) {
                input.checked = false;
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
            else {
                input.value = "";
            }
            removeErrorClasses(input);
        });
    }
    openModal() {
        // Live text for name
        const personalData = this.groups.find((group) => group.name === "personalData");
        const nameInputs = personalData.element.querySelectorAll("#firstName, #lastName");
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
    async closeModal() {
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
    initAccordions() {
        const accordionElements = Array.from(this.modalElement.querySelectorAll(`[data-animate="accordion"]`));
        const accordionList = accordionElements.reduce((acc, accordionEl) => {
            return [...acc, new Accordion(accordionEl)];
        }, []);
        this.accordionList = accordionList;
        this.initAccordionListeners();
    }
    initAccordionListeners() {
        for (let i = 0; i < this.accordionList.length; i++) {
            const accordion = this.accordionList[i];
            accordion.component.dataset.index = i.toString();
            accordion.onClick(() => {
                this.toggleAccordion(i);
                if (!accordion.isOpen)
                    return;
                setTimeout(() => {
                    accordion.scrollIntoView(this.modal.select("modal"), 0);
                }, 500);
            });
        }
    }
    toggleAccordion(index) {
        for (let i = 0; i < this.accordionList.length; i++) {
            const accordion = this.accordionList[i];
            if (i === index) {
                accordion.toggle();
            }
            else {
                accordion.close();
            }
        }
    }
    openAccordion(index) {
        for (let i = 0; i < this.accordionList.length; i++) {
            const accordion = this.accordionList[i];
            if (i === index) {
                accordion.open();
            }
            else {
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
    accordionIndexOf(field) {
        let parentElement = field.closest('[data-animate="accordion"]');
        if (parentElement) {
            // Find the index of the accordion in the accordionList based on the component
            const accordionIndex = this.accordionList.findIndex((accordion) => accordion.component === parentElement);
            return accordionIndex !== -1 ? accordionIndex : -1; // Return the index or -1 if not found
        }
        return -1; // Return -1 if no accordion is found
    }
    getClosestGroup(element) {
        const groupEl = element.closest(`[${this.attr.fieldGroup}]`);
        if (!groupEl) {
            throw new Error(`The given element is not part of a group element.`);
        }
        return this.groups.find((group) => group.element === groupEl);
    }
    getGroupsByName(groupName) {
        return this.groups.filter((group) => group.name === groupName);
    }
    getFormInput(fieldOrId, groupName) {
        if (isFormInput(fieldOrId)) {
            return fieldOrId;
        }
        const groups = this.getGroupsByName(groupName);
        const groupElements = groups.map((group) => group.element);
        return findFormInput(groupElements, fieldOrId);
    }
    extractData(draft = false) {
        const itemData = new this.Item({ draft: draft });
        this.groups.forEach((group) => {
            const selector = exclude(wf.select.formInput, `[${this.attr.linkFields}] *`);
            const groupInputs = group.element.querySelectorAll(selector);
            const linkElements = group.element.querySelectorAll(`[${this.attr.linkFields}]`);
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
                const linkCheckbox = linkElement.querySelector(wf.select.checkboxInput);
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
    serialize() {
        return Array.from(this.items.values()).map((item) => item.serialize());
    }
    /**
     * Save the progress to localStorage
     */
    getProgress() {
        return {
            id: `${this.settings.id}`,
            version: ARRAY_STORAGE_VERSION,
            data: this.serialize(),
        };
    }
    /**
     * Load the saved progress from localStorage
     */
    loadProgress() {
        // Check if there's any saved data in localStorage
        const form = this.settings.manager.getForm(this.settings.formId);
        const progress = form?.components.find((comp) => comp.id === this.id);
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
        }
        catch (e) {
            console.error(`FormArray "${this.id}": Error loading array progress:`, e);
        }
    }
    getMessage(key, ctx) {
        const msg = this.settings.messages?.[key];
        const grammar = this.settings.grammar;
        const options = this.settings;
        if (!msg)
            return undefined;
        if (typeof msg === "function") {
            return msg({ item: ctx?.item, grammar, options });
        }
        return msg; // plain string
    }
    getDialog(type, item) {
        const dialog = this.settings.dialogs[type];
        const grammar = this.settings.grammar;
        const options = this.settings;
        const resolve = (val) => typeof val === "function" ? val({ item, grammar, options }) : (val ?? "");
        return {
            title: resolve(dialog.title),
            paragraph: resolve(dialog.paragraph),
            cancel: resolve(dialog.cancel),
            confirm: resolve(dialog.confirm),
        };
    }
}
FormArray.attr = {
    id: "data-form-array-id",
    element: "data-form-array-element",
    select: "data-form-array-select",
    fieldGroup: "data-field-group",
    linkFields: "data-link-fields",
};
FormArray.defaultSettings = {
    id: "form-array",
    formId: "form",
    container: undefined,
    manager: undefined,
    limit: undefined,
    itemClass: undefined,
    grammar: {
        item: {
            sg: "Eintrag",
            pl: "Einträge",
        },
        article: {
            sg: "der",
            pl: "die",
        },
    },
    messages: {
        empty: `Bitte fügen Sie mindestens einen Eintrag hinzu.`,
        draft: ({ item, grammar }) => `${capitalize(grammar.article.sg)} ${grammar.item.sg} "${item?.getFullName()}" ist als Entwurf gespeichert.`,
        invalid: ({ item }) => `Bitte füllen Sie alle Pflichtfelder für "${item?.getFullName()}" aus.`,
        limit: ({ options, grammar }) => `Sie können max. ${options.limit} ${options.limit === 1 ? grammar.item.sg : grammar.item.pl} hinzufügen.`,
    },
};
FormArray.attributeSelector = Selector.attr(FormArray.attr.element);
