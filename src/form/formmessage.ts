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
export class FormMessage {
  private messageFor: string;
  private component: HTMLElement;
  private messageElement: HTMLElement | null;
  public initialized: boolean = false;

  /**
   * Constructs a new FormMessage instance.
   * @param componentName The name of the component (used in `data-message-component`).
   * @param messageFor The target form field identifier (used in `data-message-for`).
   */
  constructor(componentName: string, messageFor: string) {
    this.messageFor = messageFor;
    const component: HTMLElement | null = document.querySelector(
      `[data-message-component="${componentName}"][data-message-for="${this.messageFor}"]`
    );

    if (!component) {
      console.warn(
        `No FormMessage component was found: ${componentName}, ${this.messageFor}`
      );
      return;
    }

    this.component = component;
    this.messageElement =
      this.component?.querySelector('[data-message-element="message"]') || null;
    this.reset();
    this.initialized = true;
  }

  /**
   * Displays an informational message.
   * @param message The message text to display. Defaults to `null`.
   * @param silent If `true`, skips accessibility announcements. Defaults to `false`.
   */
  public info(message: string | null = null, silent: boolean = false): void {
    if (!this.initialized) return;
    if (!silent) {
      this.component.setAttribute("aria-live", "polite");
    }
    this.setMessage(message, "info", silent);
  }

  /**
   * Displays an error message.
   * @param message The message text to display. Defaults to `null`.
   * @param silent If `true`, skips accessibility announcements. Defaults to `false`.
   */
  public error(message: string | null = null, silent: boolean = false): void {
    if (!this.initialized) return;
    if (!silent) {
      this.component.setAttribute("role", "alert");
      this.component.setAttribute("aria-live", "assertive");
    }
    this.setMessage(message, "error", silent);
  }

  /**
   * Resets the message component, hiding any displayed message.
   */
  public reset(): void {
    if (!this.initialized) return;
    this.component.classList.remove("info", "error");
  }

  /**
   * Sets the message text and type (private method).
   * @param message The message text to display. Defaults to `null`.
   * @param type The type of message (`"info"` or `"error"`).
   * @param silent If `true`, skips accessibility announcements. Defaults to `false`.
   */
  private setMessage(
    message: string | null = null,
    type: "info" | "error",
    silent: boolean = false
  ): void {
    if (!this.initialized) return;
    if (this.messageElement && message) {
      this.messageElement.textContent = message;
    } else if (!this.messageElement) {
      console.warn("Message text element not found.");
    }

    // Set class based on type
    this.component.classList.remove("info", "error");
    this.component.classList.add(type);

    if (silent) return;

    this.component.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
}
