/**
 * Represents a message component for displaying info or error messages in a form.
 * Manages message state, visibility, and accessibility attributes.
 *
 * ### Required DOM Structure
 * - **Component Wrapper**: Root element with `data-message-component` and `data-message-for` attributes.
 * - **Message Element**: Child element with `data-message-element="message"` for displaying the message text.
 * - **HTML Example:**
 *   ```html
 *   <div data-message-component="example" data-message-for="input-id-or-custom-component-name">
 *     <span data-message-element="message"></span>
 *   </div>
 *   ```
 */
export declare class FormMessage {
    initialized: boolean;
    private messageFor;
    private component;
    private messageElement;
    private resetTimeoutId;
    /**
     * Constructs a new FormMessage instance.
     * @param componentName The name of the component (used in `data-message-component`).
     * @param messageFor The target form field identifier (used in `data-message-for`).
     */
    constructor(componentName: string, messageFor: string);
    /**
     * Displays an informational message.
     * @param message The message text to display. Defaults to `null`.
     * @param silent If `true`, skips accessibility announcements. Defaults to `false`.
     */
    info(message?: string | null, silent?: boolean): void;
    /**
     * Displays an error message.
     * @param message The message text to display. Defaults to `null`.
     * @param silent If `true`, skips accessibility announcements. Defaults to `false`.
     */
    error(message?: string | null, silent?: boolean): void;
    /**
     * Resets the message component, hiding any displayed message.
     */
    reset(): void;
    /**
     * Schedules an automatic reset of the message component after `delayMs` milliseconds.
     * Cancels any existing reset timer.
     */
    setTimedReset(delayMs: number): void;
    /**
     * Cancels any existing timer.
     */
    clearTimeout(): void;
    /**
     * Sets the message text and type (private method).
     * @param message The message text to display. Defaults to `null`.
     * @param type The type of message (`"info"` or `"error"`).
     * @param silent If `true`, skips accessibility announcements. Defaults to `false`.
     */
    private setMessage;
}
