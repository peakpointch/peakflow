import Selector from "../selector/index.js";
import { mergeOptions } from "../utils/index.js";

type SplitButtonElement = "component" | "button" | "trigger" | "list" | "option";

interface SplitButtonAttributes {
  id: string;
  element: string;
  key: string;
  label: string;
}

export type ButtonAction = {
  label: string;
  element: HTMLElement;
  handler: () => void;
};

interface SplitButtonSettings {
  id?: string;
  hideSelectedAction: boolean;
}

export class SplitButton<ActionKey extends string = string> {
  public static get attr(): SplitButtonAttributes {
    return {
      id: "data-split-button-id",
      element: "data-split-button-element",
      key: "data-split-button-key",
      label: "data-split-button-label",
    };
  }
  public static get defaultSettings(): SplitButtonSettings {
    return {
      id: undefined,
      hideSelectedAction: true,
    };
  }
  public instance: string;
  public settings: SplitButtonSettings;
  private component: HTMLElement;
  private button: HTMLButtonElement;
  private actions: Map<ActionKey, ButtonAction> = new Map();
  private currentActionKey: ActionKey | null = null;
  private renderButtonContent: (action: ButtonAction) => void = (action) => {
    this.button.textContent = action.label;
  };

  constructor(component: HTMLElement, settings: Partial<SplitButtonSettings> = {}) {
    this.component = component;
    this.settings = mergeOptions(SplitButton.defaultSettings, settings);
    this.instance = this.settings.id || component.getAttribute(SplitButton.attr.id) || "";
    component.setAttribute(SplitButton.attr.id, this.instance);

    // Find main button
    this.button = this.select("button");
    // Find all dropdown options
    const dropdownOptions = this.selectAll("option");

    dropdownOptions.forEach((optionEl) => {
      const key = optionEl.getAttribute(SplitButton.attr.key) as ActionKey;
      const label =
        optionEl.getAttribute(SplitButton.attr.label) || optionEl.textContent?.trim() || "";
      if (!key) return;

      // Placeholder handler (can be overridden)
      this.actions.set(key, {
        label,
        element: optionEl,
        handler: () => {},
      });

      optionEl.addEventListener("click", () => {
        this.setAction(key);
        this.executeAction();
      });
    });

    this.button.addEventListener("click", () => {
      this.executeAction();
    });
  }

  private static attributeSelector = Selector.attr<SplitButtonElement>(SplitButton.attr.element);

  /**
   * Static selector
   */
  public static selector(element: SplitButtonElement, instance?: string): string {
    const base = SplitButton.attributeSelector(element);
    return instance ? `${base}[${SplitButton.attr.id}="${instance}"]` : base;
  }

  /**
   * Instance selector
   */
  public selector(element: SplitButtonElement, local = true): string {
    return local ? SplitButton.selector(element, this.instance) : SplitButton.selector(element);
  }

  public static select<T extends Element = HTMLElement>(
    element: SplitButtonElement,
    instance?: string,
  ): T | null {
    return document.querySelector<T>(SplitButton.selector(element, instance));
  }

  public static selectAll<T extends Element = HTMLElement>(
    element: SplitButtonElement,
    instance?: string,
  ): NodeListOf<T> {
    return document.querySelectorAll<T>(SplitButton.selector(element, instance));
  }

  public select<T extends Element = HTMLElement>(
    element: SplitButtonElement,
    local: boolean = true,
  ): T {
    return local
      ? this.component.querySelector<T>(SplitButton.selector(element))!
      : document.querySelector<T>(SplitButton.selector(element, this.instance))!;
  }

  public selectAll<T extends Element = HTMLElement>(
    element: SplitButtonElement,
    local: boolean = true,
  ): NodeListOf<T> {
    return local
      ? this.component.querySelectorAll<T>(SplitButton.selector(element))
      : document.querySelectorAll<T>(SplitButton.selector(element, this.instance));
  }

  public setRenderButtonContent(renderer: (action: ButtonAction) => void) {
    this.renderButtonContent = renderer;
  }

  public setAction(key: ActionKey) {
    if (!this.actions.has(key)) {
      throw new Error(`Button action '${key}' not found`);
    }
    const action = this.actions.get(key)!;
    if (this.settings.hideSelectedAction) {
      this.actions.get(this.currentActionKey!)?.element.classList.remove("hide");
      action.element.classList.add("hide");
    }
    this.currentActionKey = key;
    this.renderButtonContent(action);
  }

  public setActionHandler(key: ActionKey, handler: () => void) {
    const action = this.actions.get(key);
    if (!action) {
      throw new Error(`Cannot set handler, action '${key}' not found`);
    }
    action.handler = handler;
  }

  public executeAction() {
    if (!this.currentActionKey) {
      throw new Error(`No button action selected`);
    }

    const action = this.actions.get(this.currentActionKey);
    if (!action) {
      throw new Error(`Button action '${this.currentActionKey}' not found`);
    }

    action.handler();
  }

  public showAllActionElements(): void {
    for (const action of this.actions.values()) {
      action.element.classList.remove("hide");
    }
  }
}
