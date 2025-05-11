import { FieldGroup, HTMLFormInput, fieldFromInput } from "@library/form";
import createAttribute from "@library/attributeselector";
import wf from "@library/webflow";

type FilterAction<T extends string = string, Q extends string = string> = (filters: FieldGroup<T>, fieldId: Q) => any;
type ActionElement = 'download' | 'save';
type HTMLActionElement = HTMLButtonElement;

export class FilterForm<FieldId extends string = string> {
  public container: HTMLElement;
  public data: FieldGroup<FieldId>;
  private filterFields: NodeListOf<HTMLFormInput>;
  private actionElements: NodeListOf<HTMLActionElement>
  private beforeChangeActions: FilterAction<FieldId>[] = [];
  private fieldChangeActions: Map<FieldId, FilterAction<FieldId>[]> = new Map();
  private globalChangeActions: FilterAction<FieldId>[] = []; // Stores wildcard ('*') actions
  private defaultDayRange: number = 7;
  private resizeResetFields: Map<FieldId, () => string | number | Date> = new Map();

  public static select = createAttribute<ActionElement>('data-action');

  constructor(container: HTMLElement | null, private fieldIds?: readonly FieldId[]) {
    if (!container) throw new Error(`FilterForm container can't be null`)
    container = container;
    if (container.tagName === 'form') {
      container = container.querySelector('form');
    }
    if (!container) {
      throw new Error(`Form cannot be undefined.`);
    }
    container.classList.remove("w-form");
    container.addEventListener('submit', (event) => {
      event.preventDefault();
    });

    this.container = container;
    this.filterFields = container.querySelectorAll<HTMLFormInput>(wf.select.formInput);
    this.actionElements = container.querySelectorAll<HTMLActionElement>(FilterForm.select());

    this.attachChangeListeners();
  }

  /**
   * Returns the `HTMLElement` of a specific filter input.
   */
  public getFilterInput(fieldId: FieldId): HTMLFormInput {
    const existingFields = this.getFieldIds(this.filterFields)
    if (!this.fieldExists(fieldId, existingFields)) {
      throw new Error(`Field with ID "${fieldId}" was not found`);
    }

    return Array.from(this.filterFields).find(field => field.id === fieldId);
  }

  /**
   * Returns the `HTMLElement` of a specific action element.
   */
  public getActionElement(id: ActionElement): HTMLActionElement {
    return Array.from(this.actionElements).find(element => element.id === id);
  }

  /**
   * Get all the field-ids inside the current instance.
   */
  private getFieldIds(fields: NodeListOf<HTMLFormInput>): FieldId[] {
    return Array.from(fields).map(input => input.id as FieldId);
  }

  /**
   * Check if a field-id exists in a list of field-ids.
   */
  private fieldExists(fieldId: FieldId, fieldIds: FieldId[]): boolean {
    const matches = fieldIds.filter(id => id === fieldId);
    if (matches.length === 1) {
      return true;
    } else if (matches.length > 1) {
      throw new Error(`FieldId ${fieldId} was found more than once!`)
    }
    return false;
  }

  /**
   * Attach all the event listeners needed for the form to function.
   * These event listeners ensure the instance is always in sync with the
   * current state of the FilterForm.
   */
  private attachChangeListeners(): void {
    this.filterFields.forEach(field => {
      field.addEventListener("input", (event) => this.onChange(event));
    });
    this.actionElements.forEach(element => {
      element.addEventListener("click", (event) => this.onChange(event));
    })
  }

  /**
   * Add an action to be exectued before all the onChange actions get called.
   * Use this function to validate or modify inputs if needed.
   */
  public addBeforeChange(action: FilterAction): void {
    this.beforeChangeActions.push(action);
  }

  /**
   * Push actions that run when specific fields change. Actions are executed in the order of insertion.
   * @param fields - An array of field IDs and action element IDs OR '*' for any change event.
   * @param action - An array of actions to execute when the field(s) change.
   */
  public addOnChange<T extends FieldId>(fields: readonly T[] | '*', action: FilterAction<FieldId, T>): void {
    if (fields === '*') {
      this.globalChangeActions.push(action);
    } else {
      fields.forEach((fieldId) => {
        if (!this.fieldChangeActions.has(fieldId)) {
          this.fieldChangeActions.set(fieldId, []);
        }
        this.fieldChangeActions.get(fieldId)?.push(action);
      });
    }
  }

  /**
   * Execute change actions for the specific field that changed.
   * If wildcard actions exist, they run on every change.
   */
  private onChange(event: Event): void {
    // Get current state of all fields
    let filters: FieldGroup<FieldId> = this.getFieldGroup(this.filterFields);

    const targetId = this.getTargetId(event);
    if (!targetId) {
      throw new Error(`Target is neither a FilterField nor an ActionElement.`);
    }

    this.beforeChangeActions.forEach(action => action(filters, targetId));
    filters = this.getFieldGroup(this.filterFields);

    // Run specific actions for this field
    const actions = this.fieldChangeActions.get(targetId) || [];
    actions.forEach((action) => action(filters, targetId));

    // Run wildcard actions (global change actions)
    this.globalChangeActions.forEach((action) => action(filters, targetId));
  }

  /**
   * Simulate an onChange event and invoke change actions for specified fields.
   * @param fields - An array of field IDs OR '*' for all fields.
   */
  public invokeOnChange(fields: FieldId[] | "*"): void {
    let invokedBy: FieldId;
    let filters: FieldGroup<FieldId> = this.getFieldGroup(this.filterFields);

    if (fields === "*") {
      invokedBy = "" as FieldId;
      this.beforeChangeActions.forEach(action => action(filters, invokedBy));
      filters = this.getFieldGroup(this.filterFields);
      // Invoke all actions
      const done: FilterAction<FieldId, string>[] = [];
      this.fieldChangeActions.forEach((actions) => {
        actions.forEach((action) => {
          if (!done.includes(action)) {
            action(filters, invokedBy)
            done.push(action);
          }
        });
      });
    } else {
      invokedBy = fields.length === 1 ? fields[0] : "" as FieldId;
      this.beforeChangeActions.forEach(action => action(filters, invokedBy));
      filters = this.getFieldGroup(this.filterFields);
      // Invoke specific actions
      fields.forEach(fieldId => {
        invokedBy = fieldId;
        const actions = this.fieldChangeActions.get(fieldId) || [];
        actions.forEach((action) => action(filters, invokedBy));
      });
    }
    this.globalChangeActions.forEach((action) => action(filters, invokedBy));
  }

  /**
   * Extracts the target ID from an event, whether it's a filter field or an action element.
   */
  private getTargetId(event: Event): FieldId | null {
    const target = event.target as HTMLElement;
    if (!target) return null;

    if (event.type === "input") {
      return target.id as FieldId;
    }
    if (event.type === "click" && target.hasAttribute("data-action")) {
      return target.getAttribute("data-action") as FieldId;
    }
    return null;
  }

  /**
   * Get the FieldGroup from current form state.
   * Use this method to get all the form field values as structured data 
   * alongside field metadata.
   */
  public getFieldGroup(fields: NodeListOf<HTMLFormInput> | HTMLFormInput[]): FieldGroup<FieldId> {
    this.data = new FieldGroup();
    fields = fields as NodeListOf<HTMLFormInput>;
    fields.forEach((input, index) => {
      const field = fieldFromInput(input, index);
      if (field?.id) {
        this.data.fields.set(field.id as FieldId, field);
      }
    });
    return this.data;
  }

  /**
   * Reset a field to a specific value on `window.resize` event.
   */
  public addResizeReset(fieldId: FieldId, getValue: () => string | number | Date): void {
    const existingFields = this.getFieldIds(this.filterFields);
    if (!this.fieldExists(fieldId, existingFields)) {
      throw new Error(`Field with ID "${fieldId}" was not found`);
    }

    // Store the function that provides the reset value
    this.resizeResetFields.set(fieldId, getValue);

    // Attach resize event listener only once
    if (this.resizeResetFields.size === 1) {
      window.addEventListener('resize', () => this.applyResizeResets());
    }
  }

  /**
   * Remove a field from the reset on resize list. This will no longer reset the field on resize.
   */
  public removeResizeReset(fieldId: FieldId): void {
    this.resizeResetFields.delete(fieldId);

    // Detach event listener if no fields remain to reset on resize
    if (this.resizeResetFields.size === 0) {
      window.removeEventListener('resize', this.applyResizeResets);
    }
  }

  /**
   * Applies the reset values to the fields.
   */
  public applyResizeResets(): void {
    this.resizeResetFields.forEach((getValue, fieldId) => {
      let value = getValue();

      if (value instanceof Date) {
        value = value.toISOString().split('T')[0]; // Format Date to YYYY-MM-DD
      }

      this.getFilterInput(fieldId).value = value.toString();
    });
  }

  /**
   * Set a custom day range for validation.
   * If no custom range is needed, revert to default.
   */
  public setDayRange(dayRange: number): number {
    if (dayRange <= 0) {
      throw new Error(`Day range must be at least "1".`);
    }
    this.defaultDayRange = dayRange;
    return this.defaultDayRange;
  }

  /**
   * Validate the date range between startDate and endDate.
   * Ensure they remain within the chosen day range.
   *
   * @param startDateFieldId The field id of the startdate `HTMLFormInput`
   * @param endDateFieldId The field id of the enddate `HTMLFormInput`
   */
  public validateDateRange(startDateFieldId: FieldId, endDateFieldId: FieldId, customDayRange?: number): void {
    const startDateInput = this.getFilterInput(startDateFieldId) as HTMLInputElement;
    const endDateInput = this.getFilterInput(endDateFieldId) as HTMLInputElement;

    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    let activeRange: number = customDayRange ?? this.defaultDayRange;
    activeRange -= 1;

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const diffInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      // Determine which field was changed (by checking focus or value)
      let activeField = 'other';
      if (document.activeElement === startDateInput) {
        activeField = 'startDate';
      } else if (document.activeElement === endDateInput) {
        activeField = 'endDate';
      }

      if (activeField === 'startDate' || activeField === 'other') {
        // Adjust `endDate` based on `startDate`
        if (diffInDays !== activeRange) {
          const newEndDate = new Date(startDate);
          newEndDate.setDate(startDate.getDate() + activeRange);
          endDateInput.value = newEndDate.toISOString().split('T')[0];
        } else if (diffInDays < 0) {
          endDateInput.value = startDate.toISOString().split('T')[0];
        }
      } else if (activeField === 'endDate') {
        // Adjust `startDate` based on `endDate`
        if (diffInDays !== activeRange) {
          const newStartDate = new Date(endDate);
          newStartDate.setDate(endDate.getDate() - activeRange);
          startDateInput.value = newStartDate.toISOString().split('T')[0];
        } else if (diffInDays < 0) {
          startDateInput.value = endDate.toISOString().split('T')[0];
        }
      }
    }
  }
}
