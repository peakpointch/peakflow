import { FormArrayItem, type ItemConstructor } from "./item";
import { FormProgressManager, type FieldGroupValidation } from "../index.js";
import SplitButton from "../../split-button";
import { Modal, AlertDialog } from "../../modal";
import type { PartialDeep } from "type-fest";
interface ProspectArrayOptions<Item extends FormArrayItem> {
    /** Unique identifier of this prospect array */
    id: string | number;
    /** Used to store progress of this component */
    formId: string;
    /** Limit the number of items allowed */
    limit?: number;
    /** Progress Manager of the parent form */
    manager: FormProgressManager;
    item: ItemConstructor<Item>;
}
type ModalGroup<T extends string = string> = {
    isValid: boolean;
    element: HTMLElement;
    name: T;
};
type OnOpenCallback = (prospect?: FormArrayItem) => void;
type OnCloseCallback = () => void;
export default class ProspectArray<Item extends FormArrayItem> {
    static readonly options: ProspectArrayOptions<FormArrayItem>;
    options: ProspectArrayOptions<Item>;
    initialized: boolean;
    id: string | number;
    prospects: Map<string, FormArrayItem>;
    modal: Modal;
    modalElement: HTMLElement;
    alertDialog: AlertDialog;
    groups: ModalGroup[];
    saveOptions: SplitButton<"draft" | "save">;
    private Item;
    private container;
    private list;
    private template;
    private formMessage;
    private addButton;
    private cancelButtons;
    private modalInputs;
    private accordionList;
    private onOpenCallbacks;
    private onCloseCallbacks;
    private editingKey;
    private unsavedProspect;
    constructor(container: HTMLElement, options: PartialDeep<ProspectArrayOptions<Item>>);
    private initialize;
    private initializeLinkedFields;
    private linkFields;
    private unlinkFields;
    private unlinkAllProspects;
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
     * Retrieves a `ResidentProspect` instance from a given key or returns the provided `ResidentProspect` directly.
     *
     * @param prospectOrKeyOrIndex - Either the key of the prospect or the prospect object itself.
     * @returns {FormArrayItem} The corresponding `ResidentProspect` object.
     * @throws Error if the prospect with the given key is not found.
     */
    getProspect(prospectOrKeyOrIndex: FormArrayItem | string | number): FormArrayItem;
    /**
     * Gets the ResidentProspect currently being edited via the `editingKey` property.
     */
    getEditingProspect(): FormArrayItem | undefined;
    private getOtherProspect;
    /**
     * Opens an alert dialog to confirm canceling the changes made to the current ResidentProspect.
     */
    private discardChanges;
    /**
     * Opens the modal form to start a new `ResidentProspect`. Creates an unsaved prospect.
     */
    startNewProspect(): void;
    private saveProspectFromModal;
    private saveProspect;
    private setLiveText;
    private renderList;
    private renderProspect;
    editProspect(key: string): void;
    editProspect(prospect: FormArrayItem): void;
    private onDeleteProspect;
    private deleteProspect;
    onOpen(name: string, callback: OnOpenCallback): void;
    clearOnOpen(name: string): void;
    triggerOnOpen(): void;
    onClose(name: string, callback: OnCloseCallback): void;
    clearOnClose(name: string): void;
    triggerOnClose(): void;
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
     * Used to save the prospect to local storage.
     */
    private serializeItems;
    /**
     * Save the progress to localStorage
     */
    saveProgress(): void;
    /**
     * Load the saved progress from localStorage
     */
    loadProgress(): void;
}
export {};
