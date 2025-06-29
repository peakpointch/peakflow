export declare class EditableCanvas {
    private canvas;
    private elements;
    private defaultSelector;
    private selectAll;
    constructor(canvas: HTMLElement | null, ...customSelectors: string[]);
    private initialize;
    update(): void;
    /**
     * Enable editing for a specific element.
     */
    private enableEditing;
    showHiddenElements(): void;
    /**
     * Disable editing for a specific element.
     */
    private disableEditing;
    /**
     * Attach a click listener to enable editing for an element.
     */
    private attachEditListener;
    /**
     * Attach a document-wide listener to disable editing when clicking outside editable elements.
     */
    private attachDocumentListener;
    /**
     * Cleanup method to remove all dynamically added listeners.
     * Call this method if the instance is being destroyed.
     */
    private cleanupListeners;
}
