export class FieldGroup {
    constructor(fields = new Map()) {
        this.fields = fields;
    }
    /**
     * Finds a specific `FormField` instance by id.
     *
     * @param fieldId The id attribute of the associated DOM element.
     */
    getField(fieldId) {
        return this.fields.get(fieldId);
    }
}
