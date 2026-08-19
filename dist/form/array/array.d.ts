import { type AttributeAccessorMap, type BaseAttributes } from "../../selector/index.js";
import { BaseComponent, type BaseSettings } from "../../base-component/index.js";
import { FormArrayItem, type ItemConstructor, type SerializedItem } from "./item.js";
import type { FormArrayDialogs, FormMessages, GrammarOptions } from "./messages.js";
import { FormProgressManager, type FormProgressComponent, type FieldGroupValidation } from "../index.js";
import SplitButton from "../../split-button/index.js";
import { Modal, AlertDialog } from "../../modal/index.js";
import type { PartialOptions } from "../../typeutils/index.js";
type FormArrayElement = "component" | "list" | "template" | "add" | "edit" | "delete" | "save" | "draft" | "draft-badge" | "cancel" | "circle";
type SerializedFormArray = SerializedItem[];
type OnOpenCallback = (item?: FormArrayItem) => void;
type OnCloseCallback = () => void;
type OnSaveCallback = (data: FormProgressComponent<SerializedFormArray>) => void;
type ModalGroup<T extends string = string> = {
    isValid: boolean;
    element: HTMLElement;
    name: T;
};
interface ArrayAttributes extends BaseAttributes {
    id: string;
    element: string;
    fieldGroup: string;
    linkFields: string;
    select: string;
}
export interface FormArraySettings<Item extends FormArrayItem> extends BaseSettings {
    /** Unique identifier of this array */
    id: string;
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
    grammar: GrammarOptions;
    messages?: FormMessages<Item>;
    /**
     * Custom messages shown for each AlertDialog type ("delete", "discard")
     */
    dialogs?: FormArrayDialogs<Item>;
}
export declare class FormArray<Item extends FormArrayItem> extends BaseComponent<FormArrayElement> {
    static readonly attr: AttributeAccessorMap<ArrayAttributes>;
    static readonly defaultSettings: FormArraySettings<FormArrayItem>;
    readonly attr: ArrayAttributes;
    alertDialog: AlertDialog;
    component: HTMLElement;
    form: HTMLElement;
    groups: ModalGroup[];
    initialized: boolean;
    id: string;
    items: Map<string, Item>;
    modal: Modal;
    modalElement: HTMLElement;
    settings: FormArraySettings<Item>;
    splitButton: SplitButton<"draft" | "save">;
    private Item;
    private list;
    private template;
    private formMessage;
    private addButton;
    private cancelButtons;
    private modalInputs;
    private accordionList;
    private onOpenCallbacks;
    private onCloseCallbacks;
    private onSaveCallbacks;
    private editingKey;
    private unsavedItem;
    constructor(settings: PartialOptions<FormArraySettings<Item>>);
    protected static readonly attributeSelector: import("../../selector/selector.js").AttributeSelector<FormArrayElement>;
    static readonly selector: import("../../selector/selector.js").InstanceSelector<FormArrayElement>;
    static readonly select: <U extends Element = HTMLElement>(this: unknown, element: FormArrayElement, instance?: string, options?: import("../../selector/selector.js").SelectOptions) => U;
    static selectAll: <U extends Element = HTMLElement>(this: unknown, element: FormArrayElement, instance?: string, options?: import("../../selector/selector.js").SelectOptions) => NodeListOf<U>;
    registerSelects(suffix?: string): void;
    private initialize;
    private initializeLinkedFields;
    private linkFields;
    private unlinkFields;
    private unlinkAllItems;
    /**
     * Updates the values of the linked fields inside `target` with the ones from `source`.
     *
     * @param id The id of the group of the linked fields
     */
    private syncLinkedFields;
    /**
     * Sync all linked fields of `target` with the ones from `source`.
     */
    private syncLinkedFieldsAll;
    private handleLinkedFieldsVisibility;
    /**
     * Retrieves a `Item` instance from a given key or returns the provided `Item` directly.
     *
     * @param itemOrKeyOrIndex - Either the key of the item or the item object itself.
     * @returns {Item} The corresponding `Item` object.
     * @throws Error if the item with the given key is not found.
     */
    getItem(itemOrKeyOrIndex: Item | string | number): Item;
    /**
     * Gets the `Item` currently being edited via the `editingKey` property.
     */
    getEditingItem(): Item | undefined;
    private getOtherItem;
    /**
     * Opens an alert dialog to confirm canceling the changes made to the current `Item`.
     */
    private discardChanges;
    /**
     * Opens the modal form to start a new `Item`. Creates an unsaved item.
     */
    startNewItem(): void;
    private saveItemFromModal;
    private saveItem;
    private setLiveText;
    private renderList;
    private renderItem;
    editItem(key: string): void;
    editItem(item: Item): void;
    private onDeleteItem;
    private deleteItem;
    onOpen(name: string, callback: OnOpenCallback): void;
    clearOnOpen(name: string): void;
    triggerOnOpen(): void;
    onClose(name: string, callback: OnCloseCallback): void;
    clearOnClose(name: string): void;
    triggerOnClose(): void;
    onSave(name: string, callback: OnSaveCallback, initialize?: boolean): void;
    clearOnSave(name: string): void;
    triggerOnSave(): void;
    private populateModal;
    validate(): boolean;
    validateModalGroup(group: ModalGroup): FieldGroupValidation;
    private validateModal;
    private reportInvalidField;
    private clearModal;
    openModal(): void;
    closeModal(): Promise<void>;
    private initAccordions;
    private initAccordionListeners;
    private toggleAccordion;
    private openAccordion;
    /**
     * Finds the index of the accordion that contains a specific field element.
     * This method traverses the DOM to locate the accordion that wraps the field
     * and returns its index in the `accordionList`.
     *
     * @param field - The form element (field) to search for within the accordions.
     * @returns The index of the accordion containing the field, or `-1` if no accordion contains the field.
     */
    private accordionIndexOf;
    getClosestGroup(element: HTMLElement): ModalGroup;
    private getGroupsByName;
    private getFormInput;
    private extractData;
    /**
     * Used to save the item to local storage.
     */
    serialize(): SerializedFormArray;
    /**
     * Save the progress to localStorage
     */
    getProgress(): FormProgressComponent<SerializedFormArray>;
    /**
     * Load the saved progress from localStorage
     */
    loadProgress(): void;
    private getMessage;
    private getDialog;
}
export {};
