import { FieldGroup } from "./fieldgroup";
import { HTMLFormInput } from "./utility";
type FilterAction<T extends string = string, Q extends string = string> = (filters: FieldGroup<T>, fieldId: Q) => any;
type ActionElement = 'download' | 'save';
type HTMLActionElement = HTMLButtonElement;
export declare class FilterForm<FieldId extends string = string> {
    private fieldIds?;
    container: HTMLElement;
    data: FieldGroup<FieldId>;
    private filterFields;
    private actionElements;
    private beforeChangeActions;
    private fieldChangeActions;
    private globalChangeActions;
    private defaultDayRange;
    private resizeResetFields;
    static select: import("..").AttributeSelector<ActionElement>;
    constructor(container: HTMLElement | null, fieldIds?: readonly FieldId[]);
    /**
     * Returns the `HTMLElement` of a specific filter input.
     */
    getFilterInput(fieldId: FieldId): HTMLFormInput;
    /**
     * Returns the `HTMLElement` of a specific action element.
     */
    getActionElement(id: ActionElement): HTMLActionElement;
    /**
     * Get all the field-ids inside the current instance.
     */
    private getFieldIds;
    /**
     * Check if a field-id exists in a list of field-ids.
     */
    private fieldExists;
    /**
     * Attach all the event listeners needed for the form to function.
     * These event listeners ensure the instance is always in sync with the
     * current state of the FilterForm.
     */
    private attachChangeListeners;
    /**
     * Add an action to be exectued before all the onChange actions get called.
     * Use this function to validate or modify inputs if needed.
     */
    addBeforeChange(action: FilterAction): void;
    /**
     * Push actions that run when specific fields change. Actions are executed in the order of insertion.
     * @param fields - An array of field IDs and action element IDs OR '*' for any change event.
     * @param action - An array of actions to execute when the field(s) change.
     */
    addOnChange<T extends FieldId>(fields: readonly T[] | '*', action: FilterAction<FieldId, T>): void;
    /**
     * Execute change actions for the specific field that changed.
     * If wildcard actions exist, they run on every change.
     */
    private onChange;
    /**
     * Simulate an onChange event and invoke change actions for specified fields.
     * @param fields - An array of field IDs OR '*' for all fields.
     */
    invokeOnChange(fields: FieldId[] | "*"): void;
    /**
     * Extracts the target ID from an event, whether it's a filter field or an action element.
     */
    private getTargetId;
    /**
     * Get the FieldGroup from current form state.
     * Use this method to get all the form field values as structured data
     * alongside field metadata.
     */
    getFieldGroup(fields: NodeListOf<HTMLFormInput> | HTMLFormInput[]): FieldGroup<FieldId>;
    /**
     * Reset a field to a specific value on `window.resize` event.
     */
    addResizeReset(fieldId: FieldId, getValue: () => string | number | Date): void;
    /**
     * Remove a field from the reset on resize list. This will no longer reset the field on resize.
     */
    removeResizeReset(fieldId: FieldId): void;
    /**
     * Applies the reset values to the fields.
     */
    applyResizeResets(): void;
    /**
     * Set a custom day range for validation.
     * If no custom range is needed, revert to default.
     */
    setDayRange(dayRange: number): number;
    /**
     * Validate the date range between startDate and endDate.
     * Ensure they remain within the chosen day range.
     *
     * @param startDateFieldId The field id of the startdate `HTMLFormInput`
     * @param endDateFieldId The field id of the enddate `HTMLFormInput`
     */
    validateDateRange(startDateFieldId: FieldId, endDateFieldId: FieldId, customDayRange?: number): void;
}
export {};
