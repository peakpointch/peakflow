import gsap from "gsap";
import { BaseComponent, type BaseSettings } from "../base-component";
import Selector from "../selector";
import type { PartialOptions } from "../typeutils/index.js";

export type ToggleElement = "component" | "checkbox" | "toggle";

export interface ToggleSettings extends BaseSettings {
  colors: {
    active: string;
    inactive: string;
    activeToggle: string;
    inactiveToggle: string;
  };
}

export class Toggle extends BaseComponent<ToggleElement, ToggleSettings> {
  public static readonly defaultSettings: ToggleSettings = {
    id: undefined,
    colors: {
      active: "#34C759",
      activeToggle: "#FFFFFF",
      inactive: "#cccccc",
      inactiveToggle: "#FEFEFE",
    },
  };

  public static readonly attr = {
    id: "data-toggle-id",
    element: "data-toggle-element",
  };

  public checkbox: HTMLInputElement;
  public toggle: HTMLElement;

  constructor(checkbox: HTMLInputElement, options?: PartialOptions<ToggleSettings>) {
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

  protected static attributeSelector = Selector.attr<ToggleElement>(Toggle.attr.element);
  public static selector = Selector.instance<ToggleElement>(this.attributeSelector, this.attr);
  public static select = Selector.select<ToggleElement>(this.selector);
  public static selectAll = Selector.selectAll<ToggleElement>(this.selector);

  private initEventListeners(): void {
    this.checkbox.addEventListener("change", () => this.updateToggleState());
  }

  private updateToggleState() {
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
    } else {
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

  public static initAll(
    container: HTMLElement | Document = document.body,
    settings?: PartialOptions<Omit<ToggleSettings, "id">>,
  ): void {
    const components = container.querySelectorAll<HTMLInputElement>(Toggle.selector("component"));
    components.forEach((element) => {
      new Toggle(element, settings);
    });
  }
}
