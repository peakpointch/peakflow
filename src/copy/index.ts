import createAttribute from "../attributeselector";

type CopyComponentElement = "component" | "button";

export class CopyComponent {
  public trigger: HTMLButtonElement;
  public data: string;
  private config = {
    logPrefix: `Copy Component: `,
  };
  public static readonly attr = {
    component: "data-copy-component",
    element: "data-copy-element",
    data: "data-copy-data",
  };

  constructor(trigger: HTMLButtonElement, data: string | number) {
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

  public static selector = createAttribute<CopyComponentElement>(this.attr.element);

  public static create(component: HTMLElement): CopyComponent {
    const button = component.querySelector<HTMLButtonElement>(CopyComponent.selector("button"));
    const copyData = component.getAttribute(CopyComponent.attr.data);

    return new CopyComponent(button, copyData);
  }

  private initEventListener(): void {
    this.trigger.addEventListener("click", () => {
      navigator.clipboard.writeText(this.data);
    });
  }
}

export function initCopyComponents(): void {
  const selector = [CopyComponent.selector("component"), `[${CopyComponent.attr.component}]`].join(
    " ",
  );
  const allComponents = document.querySelectorAll<HTMLElement>(selector);
  allComponents.forEach((component) => CopyComponent.create(component));
}
