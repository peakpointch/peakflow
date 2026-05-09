import Logger from "../logger/";
import { Selector } from "../selector";
import { mergeOptions } from "../utils";
/**
 * Base class for components with attribute-based selectors
 */
export class BaseComponent {
    constructor(component, settings) {
        if (!component)
            throw new Error(`Component element cannot be null`);
        const SubClass = this.constructor;
        this.component = component;
        this.settings = mergeOptions(SubClass.defaultSettings, settings);
        this.id = this.settings.id || component.getAttribute(SubClass.attr.id);
    }
    selector(element, global = false) {
        const SubClass = this.constructor;
        return global ? SubClass.selector(element, this.id) : SubClass.selector(element);
    }
    select(element, global = false) {
        const selector = this.selector(element, global);
        return (global ? document.querySelector(selector) : this.component.querySelector(selector));
    }
    selectAll(element, global = false) {
        const selector = this.selector(element, global);
        return (global ? document.querySelectorAll(selector) : this.component.querySelectorAll(selector));
    }
    set debug(val) {
        if (val && !this.logger) {
            const SubClass = this.constructor;
            this.logger = new Logger(SubClass.name.replace("_", ""));
            this.logger.instance = this.id;
        }
    }
    static get attributeSelector() {
        return Selector.attr(this.attr.element);
    }
    static get selector() {
        return Selector.instance(this.attributeSelector, this.attr);
    }
    static get select() {
        return Selector.select(this.selector);
    }
    static get selectAll() {
        return Selector.selectAll(this.selector);
    }
}
BaseComponent.defaultSettings = {
    id: undefined,
};
BaseComponent.attr = {
    id: "data-id",
    element: "data-element",
};
