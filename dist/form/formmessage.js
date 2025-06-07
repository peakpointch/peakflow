class FormMessage {
  /**
   * Constructs a new FormMessage instance.
   * @param componentName The name of the component (used in `data-message-component`).
   * @param messageFor The target form field identifier (used in `data-message-for`).
   */
  constructor(componentName, messageFor) {
    this.initialized = false;
    this.resetTimeoutId = null;
    this.messageFor = messageFor;
    const component = document.querySelector(
      `[data-message-component="${componentName}"][data-message-for="${this.messageFor}"]`
    );
    if (!component) {
      console.warn(
        `No FormMessage component was found: ${componentName}, ${this.messageFor}`
      );
      return;
    }
    this.component = component;
    this.messageElement = this.component?.querySelector('[data-message-element="message"]') || null;
    this.reset();
    this.initialized = true;
  }
  /**
   * Displays an informational message.
   * @param message The message text to display. Defaults to `null`.
   * @param silent If `true`, skips accessibility announcements. Defaults to `false`.
   */
  info(message = null, silent = false) {
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
  error(message = null, silent = false) {
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
  reset() {
    if (!this.initialized) return;
    if (this.resetTimeoutId !== null) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    this.component.classList.remove("info", "error");
    if (this.messageElement) {
      this.messageElement.textContent = "";
    }
    this.component.removeAttribute("aria-live");
    this.component.removeAttribute("role");
  }
  /**
   * Schedules an automatic reset of the message component after `delayMs` milliseconds.
   * Cancels any existing reset timer.
   */
  setTimedReset(delayMs) {
    if (!this.initialized) return;
    if (this.resetTimeoutId !== null) {
      clearTimeout(this.resetTimeoutId);
    }
    this.resetTimeoutId = window.setTimeout(() => {
      this.reset();
      this.resetTimeoutId = null;
    }, delayMs);
  }
  /**
   * Sets the message text and type (private method).
   * @param message The message text to display. Defaults to `null`.
   * @param type The type of message (`"info"` or `"error"`).
   * @param silent If `true`, skips accessibility announcements. Defaults to `false`.
   */
  setMessage(message = null, type, silent = false) {
    if (!this.initialized) return;
    if (this.messageElement && message) {
      this.messageElement.textContent = message;
    } else if (!this.messageElement) {
      console.warn("Message text element not found.");
    }
    this.component.classList.remove("info", "error");
    this.component.classList.add(type);
    if (silent) return;
    this.component.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}
export {
  FormMessage
};
