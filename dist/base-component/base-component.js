var _a;
import Logger from "../logger/index.js";
import { Selector, } from "../selector/index.js";
import { mergeOptions } from "../utils/index.js";
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
    enableLogging(level) {
        if (!this.logger) {
            const className = this.constructor.name.replace("_", "");
            this.logger = new Logger(className, level);
            this.logger.instance = this.id;
        }
        else {
            this.logger.setLevel(level);
        }
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
BaseComponent.attributeSelector = Selector.attr(function () {
    return this.attr.element;
});
BaseComponent.selector = Selector.instance(_a.attributeSelector, function () {
    return this.attr;
});
BaseComponent.select = Selector.select(_a.selector);
BaseComponent.selectAll = Selector.selectAll(_a.selector);
