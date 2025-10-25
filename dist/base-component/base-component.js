var _a;
import { Selector } from "../attributeselector";
/**
 * Base class for components with attribute-based selectors
 */
export class BaseComponent {
    constructor(component, instance) {
        if (!component)
            throw new Error(`Component element cannot be null`);
        this.component = component;
        this.instance = instance || this.constructor.attr.id;
    }
    /**
     * Instance method: returns a selector string
     */
    selector(element, local = true) {
        const ctor = this.constructor;
        return local ? ctor.selector(element, this.instance) : ctor.selector(element);
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
BaseComponent.attr = {
    id: "data-id",
    element: "data-element",
};
BaseComponent.attributeSelector = Selector.attr(_a.attr.element);
BaseComponent.selector = Selector.instance(_a.attributeSelector, _a.attr);
BaseComponent.select = Selector.select(_a.selector);
BaseComponent.selectAll = Selector.selectAll(_a.selector);
