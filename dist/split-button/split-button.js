import Selector from "../selector/index.js";
import { mergeOptions } from "../utils/index.js";
export class SplitButton {
    static get attr() {
        return {
            id: "data-split-button-id",
            element: "data-split-button-element",
            key: "data-split-button-key",
            label: "data-split-button-label",
        };
    }
    static get defaultSettings() {
        return {
            id: undefined,
            hideSelectedAction: true,
        };
    }
    constructor(component, settings = {}) {
        this.actions = new Map();
        this.currentActionKey = null;
        this.renderButtonContent = (action) => {
            this.button.textContent = action.label;
        };
        this.component = component;
        this.settings = mergeOptions(SplitButton.defaultSettings, settings);
        this.instance = this.settings.id || component.getAttribute(SplitButton.attr.id) || "";
        component.setAttribute(SplitButton.attr.id, this.instance);
        // Find main button
        this.button = this.select("button");
        // Find all dropdown options
        const dropdownOptions = this.selectAll("option");
        dropdownOptions.forEach((optionEl) => {
            const key = optionEl.getAttribute(SplitButton.attr.key);
            const label = optionEl.getAttribute(SplitButton.attr.label) || optionEl.textContent?.trim() || "";
            if (!key)
                return;
            // Placeholder handler (can be overridden)
            this.actions.set(key, {
                label,
                element: optionEl,
                handler: () => { },
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
    /**
     * Static selector
     */
    static selector(element, instance) {
        const base = SplitButton.attributeSelector(element);
        return instance ? `${base}[${SplitButton.attr.id}="${instance}"]` : base;
    }
    /**
     * Instance selector
     */
    selector(element, local = true) {
        return local ? SplitButton.selector(element, this.instance) : SplitButton.selector(element);
    }
    static select(element, instance) {
        return document.querySelector(SplitButton.selector(element, instance));
    }
    static selectAll(element, instance) {
        return document.querySelectorAll(SplitButton.selector(element, instance));
    }
    select(element, local = true) {
        return local
            ? this.component.querySelector(SplitButton.selector(element))
            : document.querySelector(SplitButton.selector(element, this.instance));
    }
    selectAll(element, local = true) {
        return local
            ? this.component.querySelectorAll(SplitButton.selector(element))
            : document.querySelectorAll(SplitButton.selector(element, this.instance));
    }
    setRenderButtonContent(renderer) {
        this.renderButtonContent = renderer;
    }
    setAction(key) {
        if (!this.actions.has(key)) {
            throw new Error(`Button action '${key}' not found`);
        }
        const action = this.actions.get(key);
        if (this.settings.hideSelectedAction) {
            this.actions.get(this.currentActionKey)?.element.classList.remove("hide");
            action.element.classList.add("hide");
        }
        this.currentActionKey = key;
        this.renderButtonContent(action);
    }
    setActionHandler(key, handler) {
        const action = this.actions.get(key);
        if (!action) {
            throw new Error(`Cannot set handler, action '${key}' not found`);
        }
        action.handler = handler;
    }
    executeAction() {
        if (!this.currentActionKey) {
            throw new Error(`No button action selected`);
        }
        const action = this.actions.get(this.currentActionKey);
        if (!action) {
            throw new Error(`Button action '${this.currentActionKey}' not found`);
        }
        action.handler();
    }
    showAllActionElements() {
        for (const action of this.actions.values()) {
            action.element.classList.remove("hide");
        }
    }
}
SplitButton.attributeSelector = Selector.attr(SplitButton.attr.element);
