import createAttribute from "../attributeselector/index.js";
import { toCamelCase } from "../utils/parameterize.js";
import { format, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { de } from "date-fns/locale";
import wf from "../webflow/index.js";
import deepMerge from "../utils/deepmerge.js";
import { logPrefix } from "../utils/logger.js";
import type { DashToCamelCase } from "../typeutils/index.js";
import type { IANATimeZone } from "../timezones/index.js";

type VisibilityControl = boolean | "emptyState";
type UnparsedBoolean<T> = Exclude<T, boolean> | "true" | "false";

type FilterAttributeType = {
  string: string;
  number: number;
  boolean: boolean;
  date: Date;
};

export type FilterAttributes<T extends string = string> = {
  [K in T]: keyof FilterAttributeType;
};

type PropsFromFilterAttributes<F extends FilterAttributes> = {
  [K in keyof F as DashToCamelCase<K & string>]?: FilterAttributeType[F[K]];
};

export type RenderField<F extends FilterAttributes<keyof F & string> = {}> = {
  element: string;
  instance?: string;
  value: string;
  type?: "text" | "html" | "date";
  visibility: boolean;
  decorative?: boolean;
  props?: PropsFromFilterAttributes<F>;
};

export type RenderElement<F extends FilterAttributes<keyof F & string> = {}> = {
  element: string;
  instance?: string;
  fields: RenderData<F>;
  visibility: boolean;
  decorative?: boolean;
  props?: PropsFromFilterAttributes<F>;
};

export type RenderData<F extends FilterAttributes = {}> = Array<RenderField<F> | RenderElement<F>>;

export interface RendererOptions<F extends FilterAttributes<keyof F & string> = {}> {
  /**
   * The base attribute used to identify render elements in the DOM.
   *
   * @example
   * "render" will look for elements like:
   *   <div data-render-element="example" />.
   */
  attributeName: string;
  /**
   * Defines which HTML attributes should be read as typed values on `props`
   * of `RenderField` and `RenderElement`. Keys must be in dash-case and will
   * be converted to camelCase. Values indicate the expected type.
   * –
   * @example
   * { "start-date": "date" } maps to props: { startDate: Date }
   * For: <div data-render-element="event" start-date="2024-01-01" />
   */
  filterAttributes: F;

  /**
   * The IANA timezone name used when parsing dates from the DOM.
   *
   * This is important if the DOM values are in a fixed timezone
   * (e.g., "Europe/Zurich") while your JavaScript runtime may use another.
   *
   * Set to `false` to disable timezone handling and treat dates as-is.
   *
   * @example
   * timezone: "Europe/Zurich"
   */
  timezone?: false | IANATimeZone;
  defaults: {
    visibilityControl: VisibilityControl;
  };
}

export class Renderer<F extends FilterAttributes<keyof F & string> = {}> {
  public static readonly defaultOptions: RendererOptions = {
    attributeName: "render",
    filterAttributes: {},
    timezone: false,
    defaults: {
      visibilityControl: false,
    },
  };

  public options: RendererOptions<F>;

  private canvas: HTMLElement;
  private data: RenderData<F>;
  private lp: string = "Renderer:";
  private attributeName: string = "render";

  private attr: {
    element: string;
    field: string;
    emptyState: string;
    collection: string;
    decorative: string;
    hideSelf: string;
    hideAncestor: string;
    visibilityControl: string;
    clear: string;
  };

  constructor(canvas: HTMLElement | null, options?: Partial<RendererOptions<F>>) {
    if (!canvas) throw new Error(`${this.lp}Canvas can't be undefined.`);
    this.canvas = canvas;
    this.options = deepMerge(Renderer.defaultOptions as RendererOptions<F>, options);

    this.attributeName = this.options.attributeName;

    this.attr = {
      element: `data-${this.attributeName}-element`,
      field: `data-${this.attributeName}-field`,
      emptyState: `data-${this.attributeName}-empty-state`,
      collection: `data-${this.attributeName}-collection`,
      decorative: `data-${this.attributeName}-decorative`,
      hideSelf: `data-${this.attributeName}-hide-self`,
      hideAncestor: `data-${this.attributeName}-hide-ancestor`,
      visibilityControl: `data-${this.attributeName}-visibility-control`,
      clear: `data-${this.attributeName}-clear`,
    };

    this.lp = logPrefix("Renderer", this.attributeName);
  }

  public static defineAttributes<T extends FilterAttributes>(obj: T): T {
    return obj;
  }

  public render(data: RenderData<F>, canvas: HTMLElement = this.canvas): void {
    this.clear(canvas);
    this._render(data, canvas);
  }

  private _render(data: RenderData<F>, canvas: HTMLElement = this.canvas): void {
    this.data = data;

    this.data.forEach((renderItem) => {
      // Render Elements
      if (Renderer.isRenderElement(renderItem)) {
        this.renderElement(renderItem, canvas);
      }

      // Render Fields
      if (Renderer.isRenderField(renderItem)) {
        this.renderField(renderItem, canvas);
      }
    });
  }

  /**
   * Render a `RenderElement` to all its instances
   */
  private renderElement(renderElement: RenderElement<F>, canvas: HTMLElement) {
    const selector = this.elementSelector(renderElement);
    const htmlRenderElements: NodeListOf<HTMLElement> = canvas.querySelectorAll(selector);

    if (!htmlRenderElements.length) {
      console.warn(`Element "${selector}" was not found.`);
      return;
    }

    // Recursion with visibility check
    htmlRenderElements.forEach((htmlRenderElement) => {
      let isCollection = htmlRenderElement.getAttribute(this.attr.collection) === "true";
      if (isCollection) {
        this.renderCollection(renderElement, htmlRenderElement);
      } else {
        this.renderElementToTemplate(renderElement, htmlRenderElement);
      }
    });
  }

  private renderCollection(renderElement: RenderElement<F>, htmlRenderCollection: HTMLElement) {
    switch (this.readVisibilityControl(htmlRenderCollection)) {
      case "emptyState":
        // TODO: Support "emptyState" for render collections
        break;
      case true:
        if (this.shouldHideElement(renderElement)) {
          this.hideElement(htmlRenderCollection);
          return;
        }
        break;
      case false:
      default:
        break;
    }

    let max = parseInt(htmlRenderCollection.getAttribute("data-limit-items") || "-1");
    if (max === -1) max = renderElement.fields.length;
    max = Math.min(renderElement.fields.length, max);
    max = Math.max(max, 0);

    const firstChild = htmlRenderCollection.firstElementChild;
    if (firstChild) {
      const htmlTemplate = firstChild.cloneNode(true) as HTMLElement;
      htmlRenderCollection.innerHTML = "";

      // Use DocumentFragment for performance improvement
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < max; i++) {
        const template = htmlTemplate.cloneNode(true) as HTMLElement;
        if (Renderer.isRenderElement(renderElement.fields[i])) {
          this.renderElementToTemplate(renderElement.fields[i] as RenderElement<F>, template);
        } else if (Renderer.isRenderField(renderElement.fields[i])) {
          this.renderFieldToTemplate(renderElement.fields[i] as RenderField<F>, template);
        }

        fragment.appendChild<HTMLElement>(template);
      }

      htmlRenderCollection.appendChild(fragment);
    } else {
      console.warn("No first child found to clone");
    }
  }

  /**
   * Render a `RenderElement` to a single `HTMLRenderElement`
   */
  private renderElementToTemplate(renderElement: RenderElement<F>, htmlTemplate: HTMLElement) {
    switch (this.readVisibilityControl(htmlTemplate)) {
      case "emptyState":
        const emptyStateElement = htmlTemplate.querySelector<HTMLElement>(
          `[${this.emptyStateAttr}]`,
        );
        if (this.shouldHideElement(renderElement)) {
          emptyStateElement.classList.remove("hide");
          if (emptyStateElement.style.display === "none") {
            emptyStateElement.style.removeProperty("display");
          }
        } else {
          emptyStateElement.classList.add("hide");
          emptyStateElement.style.display = "none";
        }
        // For both cases since the children next to the `emptyStateElement` have to be hidden if the empty state is shown.
        this._render(renderElement.fields, htmlTemplate);
        break;
      case true:
        if (this.shouldHideElement(renderElement)) {
          this.hideElement(htmlTemplate);
        } else {
          this._render(renderElement.fields, htmlTemplate); // Recursively render children
        }
        break;
      case false:
      default:
        this._render(renderElement.fields, htmlTemplate); // Recursively render children
        break;
    }
  }

  /**
   * Render a `RenderField` to all its instances
   */
  private renderField(renderField: RenderField<F>, canvas: HTMLElement) {
    const selector = this.fieldSelector(renderField);
    const fields: NodeListOf<HTMLElement> = canvas.querySelectorAll(selector);
    fields.forEach((htmlRenderField) => {
      this.renderFieldToTemplate(renderField, htmlRenderField);
    });
  }

  /**
   * Render a `RenderField` to a single `HTMLRenderField`
   */
  private renderFieldToTemplate(field: RenderField<F>, htmlTemplate: HTMLElement) {
    if (!field.visibility || !field.value.trim()) {
      switch (this.readVisibilityControl(htmlTemplate)) {
        case "emptyState":
          this.hideElement(htmlTemplate); // Hide empty field
          break;
        case true:
          this.hideElement(htmlTemplate); // Hide empty field
          break;
        case false:
        default:
          break;
      }
    } else {
      switch (field.type) {
        case "html":
          htmlTemplate.innerHTML = field.value;
          break;
        case "date":
          const formatStr = htmlTemplate.dataset.dateFormat || "d.M.yyyy";
          htmlTemplate.innerText = format(new Date(field.value), formatStr, {
            locale: de,
          });
          break;
        default:
          htmlTemplate.innerText = field.value;
      }
    }
  }

  /**
   * Recursively reads the DOM node and its descendants to build a structured RenderData.
   * It identifies elements with `data-${elementAttr}-element` and `data-${fieldAttr}-field` attributes,
   * and processes them into RenderElement and RenderField objects.
   *
   * @param node The root node to start reading from.
   * @returns `RenderData` An array of RenderElement and RenderField objects representing the node structure.
   */
  public read(node: HTMLElement, stopRecursionMatches: string[] = []): RenderData<F> {
    const renderData: RenderData<F> = [];

    Array.from(node.children).forEach((child) => {
      if (stopRecursionMatches.some((selector) => child.matches(selector))) {
        return; // Stop recursion for this element
      }

      // If it's a RenderElement
      if (child.hasAttribute(this.attr.element)) {
        renderData.push(this.readRenderElement(child as HTMLElement, stopRecursionMatches));
      }
      // If it's a RenderField
      else if (child.hasAttribute(this.attr.field)) {
        renderData.push(this.readRenderField(child as HTMLElement));
      }
      // If it's neither, check if any descendants are renderable
      else {
        const hasRenderableChild =
          child.querySelectorAll(`[${this.attr.element}], [${this.attr.field}]`).length > 0;

        // If there are renderable children, recurse on this child
        if (hasRenderableChild) {
          renderData.push(...this.read(child as HTMLElement, stopRecursionMatches));
        }
      }
    });

    return renderData;
  }

  public clear(node: HTMLElement = this.canvas): void {
    const collections = node.querySelectorAll<HTMLElement>(
      `${this.elementSelector()}[${this.attr.collection}]`,
    );
    collections.forEach((collection) => {
      const template = collection.firstElementChild.cloneNode(true);
      collection.innerHTML = "";
      collection.appendChild(template);
    });

    const fields = node.querySelectorAll<HTMLElement>(this.fieldSelector());
    fields.forEach((field) => {
      field.innerText = "";
      const fieldVisibility = this.readVisibilityControl(field);
      if (fieldVisibility === true || fieldVisibility === "emptyState") {
        this.showElement(field);
      }
    });

    const elements = node.querySelectorAll<HTMLElement>(this.elementSelector());
    elements.forEach((element) => {
      this.showElement(element);
    });
  }

  private readRenderElement(
    child: HTMLElement,
    stopRecursionAttributes: string[],
  ): RenderElement<F> {
    const elementName = child.getAttribute(this.attr.element);
    const instance = child.getAttribute(`data-${elementName}-instance`);

    // Recursively read child elements
    const fields = this.read(child as HTMLElement, stopRecursionAttributes); // Recurse on children

    const element: RenderElement<F> = {
      element: elementName!,
      instance: instance || undefined,
      fields,
      visibility: wf.isVisible(child),
      decorative: wf.hasAttr(child, this.attr.decorative),
      props: {},
    };

    this.readFilteringProperties(element, child);

    return element;
  }

  private readRenderField(child: HTMLElement): RenderField<F> {
    const fieldName = child.getAttribute(this.attr.field);
    const instance = child.getAttribute(`data-${fieldName}-instance`);

    // Determine field type (handle date, text, html)
    let value: string = child.innerHTML.trim();
    const type =
      child.children.length > 0 ? "html" : child.hasAttribute("data-date") ? "date" : "text";

    switch (type) {
      case "date":
        value = value;
        break;
      default:
        break;
    }

    const field: RenderField<F> = {
      element: fieldName!,
      instance: instance || undefined,
      value,
      type,
      visibility: wf.isVisible(child),
      decorative: wf.hasAttr(child, this.attr.decorative),
      props: {},
    };

    // Optionally, handle additional properties for filtering purposes
    this.readFilteringProperties(field, child);

    return field;
  }

  /**
   * Modifies the `field` properties based on the filtering attributes from `child`.
   * Handles `date` and `boolean` attributes.
   */
  private readFilteringProperties(
    field: RenderField<F> | RenderElement<F>,
    child: HTMLElement,
  ): void {
    for (let [attr, type] of Object.entries(this.options.filterAttributes)) {
      if (!child.hasAttribute(attr)) {
        continue;
      }

      let value: any = child.getAttribute(attr);
      if (!value) {
        continue;
      }

      switch (type) {
        case "date":
          let parsedDate: Date;

          // Parse the date with a 24h time string
          parsedDate = parse(value, "yyyy-MM-dd H:mm", new Date());

          // Parse the date with local midnight time
          if (isNaN(parsedDate.getTime())) {
            parsedDate = parse(value, "yyyy-MM-dd", new Date());
          }

          let parsedUTCDate = parsedDate;

          if (this.options.timezone) {
            parsedUTCDate = fromZonedTime(parsedDate, this.options.timezone);
          }

          value = isNaN(parsedUTCDate.getTime()) ? null : parsedUTCDate; // Ensure valid date
          break;

        case "boolean":
          if (value === "select") {
            // Translate webflows conditional visibility to boolean
            const targetElement = child.querySelector(`[${attr}]`);
            if (!targetElement) {
              throw new Error(
                `${this.lp}Can't parse boolean filter: No element found with attribute "[${attr}]". Perhaps you misspelled the attribute?`,
              );
            }

            value = Boolean(!targetElement.classList.contains(wf.class.invisible));
          } else {
            // Handles attribute values directly
            value = JSON.parse(value);
          }
          break;

        case "number":
          value = parseFloat(value);
          break;

        case "string":
        default:
          break;
      }

      field.props[toCamelCase(attr)] = value;
    }
  }

  /**
   * Parse the visibility control attribute value of a Render-`child`.
   *
   * ### "VisibilityControl" tells the `Renderer` wether it should mess with a `RenderElement`'s or `RenderField`'s visibility
   * - `emptyState`: Shows an empty state if the children are hidden
   * - `true`: Hides the element if there is no content to be shown.
   * - `false`: Disable visibility control, do not mess with the element's visibility.
   */
  private readVisibilityControl(child: HTMLElement): VisibilityControl {
    const raw = child
      .getAttribute(this.attr.visibilityControl)
      ?.trim() as UnparsedBoolean<VisibilityControl>;
    if (raw === "emptyState") {
      return "emptyState";
    } else if (child.hasAttribute(this.attr.visibilityControl)) {
      return wf.hasAttr(child, this.attr.visibilityControl);
    } else {
      return this.options.defaults.visibilityControl;
    }
  }

  private getEmptyStateFor(
    element: RenderElement<F> | RenderField<F>,
    template: HTMLElement,
  ): HTMLElement {
    let emptyState: HTMLElement;
    if (Renderer.isRenderField) {
      emptyState = template.parentElement?.querySelector<HTMLElement>(
        `[${this.attr.emptyState}="${element.element}"]`,
      );
    } else {
      emptyState = template.querySelector<HTMLElement>(
        `[${this.attr.emptyState}="${element.element}"]`,
      );
    }

    if (emptyState) return emptyState;
    throw new Error(`${this.lp}No empty state found for "${element.element}"`);
  }

  private shouldHideElement(element: RenderElement<F>): boolean {
    if (element.visibility === false) return true;
    // Check if all child fields and elements are empty
    return element.fields.every((child) => {
      if (Renderer.isRenderField(child)) {
        if (child.decorative) return true;
        return !child.value.trim(); // Empty field
      }
      if (Renderer.isRenderElement(child)) {
        if (child.decorative) return true;
        return child.fields.length === 0 ? true : this.shouldHideElement(child); // Recursively check child elements
      }
      return false; // Default case
    });
  }

  private showHTMLElement(element: HTMLElement): void {
    if (element.style.display === "none") {
      element.style.removeProperty("display");
    }
    if (element.classList.contains("hide")) {
      element.classList.remove("hide");
    }
  }

  private showElement(element: HTMLElement): void {
    const ancestorToHide = element.getAttribute(this.attr.hideAncestor);

    this.showHTMLElement(element);

    if (ancestorToHide) {
      // Hide the specified ancestor
      const ancestor: HTMLElement = element.closest(ancestorToHide);
      if (ancestor) {
        this.showHTMLElement(ancestor);
      } else {
        console.warn(`Ancestor "${ancestorToHide}" not found for element.`);
      }
    }
  }

  private hideHTMLElement(element: HTMLElement): void {
    element.style.display = "none";
  }

  private hideElement(element: HTMLElement): void {
    const hideSelf = wf.hasAttr(element, this.attr.hideSelf);
    const ancestorToHide = element.getAttribute(this.attr.hideAncestor);

    if (hideSelf) {
      // Hide the element itself
      this.hideHTMLElement(element);
    } else if (ancestorToHide) {
      // Hide the specified ancestor
      const ancestor: HTMLElement = element.closest(ancestorToHide);
      if (ancestor) {
        this.hideHTMLElement(ancestor);
      } else {
        console.warn(`${this.lp}Ancestor "${ancestorToHide}" not found for element.`);
      }
    }
  }

  private hideChildrenExceptEmptyState(parent: HTMLElement): void {
    const elementsAndFields = `[${this.attr.element}], [${this.attr.field}]`;
    const emptyStateAttr = `[${this.attr.emptyState}]`;
    const emptyStateChildren = `[${this.attr.emptyState}] *`;
    const selector = exclude(elementsAndFields, emptyStateAttr, emptyStateChildren);
    const elements = Array.from(parent.querySelectorAll<HTMLElement>(selector));
    for (const el of elements) {
      this.hideHTMLElement(el);
    }
  }

  // Method to add filter attributes
  public addFilterAttributes(newAttributes: FilterAttributes): void {
    Object.assign(this.options.filterAttributes, newAttributes);
  }

  // Method to remove filter attributes
  public removeFilterAttributes(...attributesToRemove: string[]): void {
    attributesToRemove.forEach((attr) => {
      delete this.options.filterAttributes[attr];
    });
  }

  private elementSelector(element?: RenderElement<F>): string {
    const elementAttrSelector = createAttribute(this.attr.element);
    if (!element) {
      return elementAttrSelector();
    }

    let selectorString = elementAttrSelector(element.element);
    if (element.instance) {
      selectorString += this.instanceSelector(element.element, element.instance);
    }
    return selectorString;
  }

  private fieldSelector(field?: RenderField<F>): string {
    const fieldAttrSelector = createAttribute(this.attr.field);
    if (!field) {
      return fieldAttrSelector();
    }

    let selectorString = fieldAttrSelector(field.element);
    if (field.instance) {
      selectorString += this.instanceSelector(field.element, field.instance);
    }
    return selectorString;
  }

  private instanceSelector(element: string, instanceId: string): string {
    return `[data-${element}-instance="${instanceId}"]`;
  }

  // Type Guard for RenderElement
  private static isRenderElement<F extends FilterAttributes = {}>(
    item: RenderElement<F> | RenderField<F>,
  ): item is RenderElement<F> {
    return (item as RenderElement<F>).fields !== undefined;
  }

  // Type Guard for RenderField
  private static isRenderField<F extends FilterAttributes = {}>(
    item: RenderElement<F> | RenderField<F>,
  ): item is RenderField<F> {
    return (item as RenderField<F>).value !== undefined;
  }
}
