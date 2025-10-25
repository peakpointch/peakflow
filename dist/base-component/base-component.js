var _a;
import { Selector } from "../attributeselector";
import { deepMerge } from "../utils";
/**
 * Base class for components with attribute-based selectors
 */
export class BaseComponent {
    constructor(component, settings) {
        if (!component)
            throw new Error(`Component element cannot be null`);
        const SubClass = this.constructor;
        this.component = component;
        this.settings = deepMerge(SubClass.defaultSettings, settings);
        this.id = this.settings.id || component.getAttribute(SubClass.attr.id);
    }
    /**
     * Instance method: returns a selector string
     */
    selector(element, local = true) {
        const ctor = this.constructor;
        return local ? ctor.selector(element, this.id) : ctor.selector(element);
    }
    select(element, local = true) {
        const selector = this.selector(element, local);
        return (local ? this.component.querySelector(selector) : document.querySelector(selector));
    }
    selectAll(element, local = true) {
        const selector = this.selector(element, local);
        return (local ? this.component.querySelectorAll(selector) : document.querySelectorAll(selector));
    }
}
_a = BaseComponent;
BaseComponent.defaultSettings = {
    id: undefined,
};
BaseComponent.attr = {
    id: "data-id",
    element: "data-element",
};
BaseComponent.attributeSelector = Selector.attr(_a.attr.element);
BaseComponent.selector = Selector.instance(_a.attributeSelector, _a.attr);
BaseComponent.select = Selector.select(_a.selector);
BaseComponent.selectAll = Selector.selectAll(_a.selector);
