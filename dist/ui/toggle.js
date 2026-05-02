var _a;
import gsap from "gsap";
import { BaseComponent } from "../base-component";
import Selector from "../selector";
export class Toggle extends BaseComponent {
    constructor(checkbox, options) {
        super(checkbox, options);
        // 1. Define the elements relative to the specific checkbox
        // The wrapper is the parent <label>
        this.checkbox = this.select("checkbox");
        // The toggle is a sibling div inside that wrapper
        this.toggle = this.select("toggle");
        if (!this.checkbox || !this.toggle) {
            throw new Error(`Checkbox or toggle element not found`);
        }
        this.initEventListeners();
        this.updateToggleState();
    }
    initEventListeners() {
        this.checkbox.addEventListener("change", () => this.updateToggleState());
    }
    updateToggleState() {
        if (this.checkbox.checked) {
            // ACTIVE STATE (ON)
            gsap.to(this.component, {
                backgroundColor: this.settings.colors.active, // Green (Example)
                borderColor: this.settings.colors.active,
                duration: 0.3,
                ease: "power2.out",
            });
            gsap.to(this.toggle, {
                x: 20, // Move 20px to the right
                backgroundColor: this.settings.colors.activeToggle, // White dot
                duration: 0.3,
                ease: "power2.out",
            });
        }
        else {
            // INACTIVE STATE (OFF)
            gsap.to(this.component, {
                backgroundColor: this.settings.colors.inactive, // Light Grey (Example - match your CSS)
                borderColor: this.settings.colors.inactive, // Grey Border (Example - match your CSS)
                duration: 0.3,
                ease: "power2.out",
            });
            gsap.to(this.toggle, {
                x: 0, // Move back to original position
                backgroundColor: this.settings.colors.inactiveToggle, // Grey dot
                duration: 0.3,
                ease: "power2.out",
            });
        }
    }
    static initAll(container = document.body, settings) {
        const components = container.querySelectorAll(_a.selector("component"));
        components.forEach((element) => {
            new _a(element, settings);
        });
    }
}
_a = Toggle;
Toggle.defaultSettings = {
    id: undefined,
    colors: {
        active: "#34C759",
        activeToggle: "#FFFFFF",
        inactive: "#cccccc",
        inactiveToggle: "#FEFEFE",
    },
};
Toggle.attr = {
    id: "data-toggle-id",
    element: "data-toggle-element",
};
Toggle.attributeSelector = Selector.attr(_a.attr.element);
Toggle.selector = Selector.instance(_a.attributeSelector, _a.attr);
Toggle.select = Selector.select(_a.selector);
Toggle.selectAll = Selector.selectAll(_a.selector);
