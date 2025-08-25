var _a;
import createAttribute from "../attributeselector";
export class CopyComponent {
    constructor(trigger, data) {
        this.config = {
            logPrefix: `Copy Component: `,
        };
        if (!trigger) {
            throw new Error(`${this.config.logPrefix}Trigger element not found.`);
        }
        if (typeof data !== "string" && typeof data !== "number") {
            throw new Error(`${this.config.logPrefix}TypeError: Wrong data format.`);
        }
        this.trigger = trigger;
        this.data = data.toString();
        this.initEventListener();
    }
    static create(component) {
        const button = component.querySelector(_a.selector("button"));
        const copyData = component.getAttribute(_a.attr.data);
        return new _a(button, copyData);
    }
    initEventListener() {
        this.trigger.addEventListener("click", () => {
            navigator.clipboard.writeText(this.data);
        });
    }
}
_a = CopyComponent;
CopyComponent.attr = {
    component: "data-copy-component",
    element: "data-copy-element",
    data: "data-copy-data",
};
CopyComponent.selector = createAttribute(_a.attr.element);
export function initCopyComponents() {
    const selector = [CopyComponent.selector("component"), `[${CopyComponent.attr.component}]`].join(" ");
    const allComponents = document.querySelectorAll(selector);
    allComponents.forEach((component) => CopyComponent.create(component));
}
