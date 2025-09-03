import createAttribute, { exclude } from "../attributeselector/index.js";
import { toCamelCase } from "../utils/parameterize.js";
import { format, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { de } from "date-fns/locale";
import wf from "../webflow/index.js";
import deepMerge from "../utils/deepmerge.js";
import { logPrefix } from "../utils/logger.js";
import type { DashToCamelCase } from "../typeutils/index.js";
import type { IANATimeZone } from "../timezones/index.js";
import type { PartialDeep, UnionToTuple } from "type-fest";

/**
 * Tells the `Renderer` how to handle the visibility of a rendered element
 * in case all its children are empty.
 */
type VisibilityControl = "emptyState" | "hideSelf" | "hideAncestor" | "none";

/**
 * Defines the type of a `FilterAttribute`.
 */
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

/**
 * A `RenderField` ...
 */
export type RenderField<F extends FilterAttributes<keyof F & string> = {}> = {
  /**
   * The name of this `RenderField`.
   *
   * This defines what kind of data this field represents, for example
   * `"title"`, `"price"`, or `"description"`.
   *
   * While it can be human-readable, its main purpose is to tell the `Renderer`
   * how to interpret and map this field.
   */
  name: string;

  /**
   * An optional instance identifier for differentiating between multiple
   * nodes with the same `name` within the same parent.
   *
   * While `name` defines the type of node (e.g., "dish", "title"),
   * `instance` uniquely identifies one occurrence of that type.
   *
   * This is useful when a parent contains repeated blocks or fields
   * of the same type and you need to distinguish or target them individually.
   *
   * @example
   * { name: "dish", instance: "1" }
   * { name: "dish", instance: "2" }
   */
  instance?: string;

  /**
   * The value of this field as a string.
   * The format or interpretation of this value depends on the `type` property.
   */
  value: string;

  /**
   * The type of this field.
   *
   * This tells the Renderer how to render the `value`
   */
  type?: "text" | "html" | "date";

  /**
   * Whether this `RenderField` should be visible when it's rendered.
   */
  visibility: boolean;

  /**
   * Marks this `RenderField` as decorative.
   *
   * Decorative fields are ignored when determining whether their parent node
   * should be hidden. In other words, even if a decorative field has a value,
   * it does not prevent the parent node from being considered empty.
   */
  decorative?: boolean;

  /**
   * Additional properties for this `RenderField`.
   *
   * Can be used to filter, sort, or otherwise categorize `RenderNode`s based on
   * custom metadata.
   */
  props?: PropsFromFilterAttributes<F>;
};

/**
 * A `RenderBlock` can wrap multiple `RenderNode`s (fields or blocks).
 * It is helpful when grouping data together in an object oriented way.
 */
export type RenderBlock<F extends FilterAttributes<keyof F & string> = {}> = {
  /**
   * The name of this `RenderBlock`.
   *
   * This property is often used as a type identifier, which specifies the type
   * of content this block holds, for example `"dish"`, `"day"`, or `"event"`.
   *
   * It is used by the `Renderer` to map the block to the corresponding DOM
   * elements and child nodes.
   */
  name: string;

  /**
   * An optional instance identifier for differentiating between multiple
   * nodes with the same `name` within the same parent.
   *
   * While `name` defines the type of node (e.g., "dish", "title"),
   * `instance` uniquely identifies one occurrence of that type.
   *
   * This is useful when a parent contains repeated blocks or fields
   * of the same type and you need to distinguish or target them individually.
   *
   * @example
   * { name: "dish", instance: "1" }
   * { name: "dish", instance: "2" }
   */
  instance?: string;

  /**
   * The children as `RenderData` this `RenderBlock` groups together
   */
  children: RenderData<F>;

  /**
   * Whether this `RenderBlock` should be visible when it's rendered.
   */
  visibility: boolean;

  /**
   * Marks this `RenderBlock` as decorative.
   *
   * Decorative blocks are ignored when determining whether their parent node
   * should be hidden. In other words, even if a decorative block's children do have
   * values, it does not prevent the parent node from being considered empty.
   */
  decorative?: boolean;

  /**
   * Additional properties for this `RenderBlock`.
   *
   * Can be used to filter, sort, or otherwise categorize `RenderNode`s based on
   * custom metadata.
   */
  props?: PropsFromFilterAttributes<F>;
};

export type RenderNode<F extends FilterAttributes = {}> = RenderField<F> | RenderBlock<F>;
export type RenderData<F extends FilterAttributes = {}> = RenderNode<F>[];

/**
 * A `HTMLRenderNode` is the DOM element where a `RenderNode` is rendered.
 *
 * These elements are marked with `data-render-*` attributes, which tell the
 * `Renderer` where in the DOM the data from a `RenderField` or `RenderBlock`
 * should be rendered.
 *
 * In other words, a `HTMLRenderNode` is the *target container* for a
 * `RenderNode`’s content.
 */
export interface HTMLRenderNode extends HTMLElement {}

/**
 * Defines the options of a `Renderer` instance.
 */
export interface RendererOptions<F extends FilterAttributes<keyof F & string> = {}> {
  /**
   * The base attribute used to identify render nodes in the DOM.
   *
   * @example
   * "render" will look for elements like:
   *   <div data-render-element="example" />.
   */
  attributeName: string;

  /**
   * Defines which HTML attributes should be read as typed values on `props`
   * of `RenderField` and `RenderBlock`. Keys must be in dash-case and will
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

  /**
   * Fallback options for `RenderNode`s when no options are set on the
   * HTMLRenderNode.
   */
  defaults: {
    visibilityControl: VisibilityControl;
    /** Whether to clear the value of a `RenderField`. */
    clear: boolean;
  };
}

export class Renderer<F extends FilterAttributes<keyof F & string> = {}> {
  public static readonly defaultOptions: RendererOptions = {
    attributeName: "render",
    filterAttributes: {},
    timezone: false,
    defaults: {
      visibilityControl: "none",
      clear: true,
    },
  };

  public options: RendererOptions<F>;

  private canvas: HTMLElement;
  private data: RenderData<F>;
  private lp: string = "Renderer:";
  private attributeName: string = "render";

  private attr: {
    block: string;
    field: string;
    emptyState: string;
    collection: string;
    decorative: string;
    hideAncestor: string;
    inheritVisibility: string;
    visibilityControl: string;
    clear: string;
  };

  constructor(canvas: HTMLElement | null, options?: PartialDeep<RendererOptions<F>>) {
    if (!canvas) throw new Error(`${this.lp}Canvas can't be undefined.`);
    this.canvas = canvas;
    this.options = deepMerge(Renderer.defaultOptions as RendererOptions<F>, options);

    this.attributeName = this.options.attributeName;

    this.attr = {
      block: `data-${this.attributeName}-element`,
      field: `data-${this.attributeName}-field`,
      emptyState: `data-${this.attributeName}-empty-state`,
      collection: `data-${this.attributeName}-collection`,
      decorative: `data-${this.attributeName}-decorative`,
      hideAncestor: `data-${this.attributeName}-hide-ancestor`,
      inheritVisibility: `data-${this.attributeName}-inherit-visibility`,
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
      // Render Blocks
      if (Renderer.isRenderBlock(renderItem)) {
        this.renderBlock(renderItem, canvas);
      }

      // Render Fields
      if (Renderer.isRenderField(renderItem)) {
        this.renderField(renderItem, canvas);
      }
    });
  }

  /**
   * Render a `RenderBlock` to all its instances
   */
  private renderBlock(renderBlock: RenderBlock<F>, canvas: HTMLElement) {
    const selector = this.blockSelector(renderBlock);
    const htmlNodes = canvas.querySelectorAll<HTMLRenderNode>(selector);

    if (!htmlNodes.length) {
      console.warn(`${this.lp}Block "${selector}" was not found.`);
      return;
    }

    // Recursion with visibility check
    htmlNodes.forEach((htmlRenderBlock) => {
      let isCollection = htmlRenderBlock.getAttribute(this.attr.collection) === "true";
      if (isCollection) {
        this.renderCollection(renderBlock, htmlRenderBlock);
      } else {
        this.renderBlockToTemplate(renderBlock, htmlRenderBlock);
      }
    });
  }

  private renderCollection(renderBlock: RenderBlock<F>, htmlNode: HTMLRenderNode) {
    const shouldHide = this.shouldHideBlock(renderBlock);
    switch (this.readVisibilityControl(htmlNode)) {
      case "emptyState":
        // TODO: Support "emptyState" for render collections
        break;
      case "hideSelf":
        if (shouldHide) {
          this.hideHTMLElement(htmlNode);
          return;
        }
        break;
      case "hideAncestor":
        if (shouldHide) {
          this.hideAncestor(renderBlock.name, htmlNode);
        }
        break;
      case "none":
      default:
        break;
    }

    let max = parseInt(htmlNode.getAttribute("data-limit-items") || "-1");
    if (max === -1) max = renderBlock.children.length;
    max = Math.min(renderBlock.children.length, max);
    max = Math.max(max, 0);

    const firstChild = htmlNode.firstElementChild;
    if (firstChild) {
      const htmlTemplate = firstChild.cloneNode(true) as HTMLElement;
      htmlNode.innerHTML = "";

      // Use DocumentFragment for performance improvement
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < max; i++) {
        const htmlItemNode = htmlTemplate.cloneNode(true) as HTMLElement;
        if (Renderer.isRenderBlock(renderBlock.children[i])) {
          this.renderBlockToTemplate(renderBlock.children[i] as RenderBlock<F>, htmlItemNode);
        } else if (Renderer.isRenderField(renderBlock.children[i])) {
          this.renderFieldToTemplate(renderBlock.children[i] as RenderField<F>, htmlItemNode);
        }

        fragment.appendChild<HTMLElement>(htmlItemNode);
      }

      htmlNode.appendChild(fragment);
    } else {
      console.warn(`${this.lp}No first child found to clone`);
    }
  }

  /**
   * Render a `RenderBlock` to a single `HTMLRenderNode`
   */
  private renderBlockToTemplate(renderBlock: RenderBlock<F>, htmlNode: HTMLRenderNode) {
    const shouldHide = this.shouldHideBlock(renderBlock);
    switch (this.readVisibilityControl(htmlNode)) {
      case "emptyState":
        const emptyState = this.getEmptyStateFor(renderBlock, htmlNode);
        if (shouldHide) {
          this.hideChildrenExceptEmptyState(htmlNode);
          this.showHTMLElement(emptyState);

          // Only render nodes that are inside the empty state element
          const emptyStateNodes = this.getChildrenForContainer(renderBlock, emptyState);
          this._render(emptyStateNodes, emptyState);
        } else {
          this.hideHTMLElement(emptyState);
          this._render(renderBlock.children, htmlNode);
        }
        break;
      case "hideSelf":
        if (shouldHide) {
          this.hideHTMLElement(htmlNode);
        } else {
          this._render(renderBlock.children, htmlNode); // Recursively render children
        }
        break;
      case "hideAncestor":
        if (shouldHide) {
          this.hideAncestor(renderBlock.name, htmlNode);
        } else {
          this._render(renderBlock.children, htmlNode); // Recursively render children
        }
        break;
      case "none":
      default:
        this._render(renderBlock.children, htmlNode); // Recursively render children
        break;
    }
  }

  /**
   * Returns the subset of children of a RenderBlock that correspond
   * to elements inside the given container element.
   */
  private getChildrenForContainer(block: RenderBlock<F>, container: HTMLElement) {
    const htmlChildren = container.querySelectorAll(`[${this.attr.block}], [${this.attr.field}]`);
    const names = Array.from(htmlChildren).map((el) =>
      el.hasAttribute(this.attr.block)
        ? el.getAttribute(this.attr.block)
        : el.getAttribute(this.attr.field),
    );
    return block.children.filter((child) => names.includes(child.name));
  }

  /**
   * Render a `RenderField` to all its instances
   */
  private renderField(renderField: RenderField<F>, canvas: HTMLElement) {
    const selector = this.fieldSelector(renderField);
    const htmlFields = canvas.querySelectorAll<HTMLRenderNode>(selector);
    htmlFields.forEach((htmlNode) => {
      this.renderFieldToTemplate(renderField, htmlNode);
    });
  }

  /**
   * Render a `RenderField` to a single `HTMLRenderField`
   */
  private renderFieldToTemplate(renderField: RenderField<F>, htmlNode: HTMLRenderNode) {
    const shouldHide = this.shouldHideField(renderField);
    switch (this.readVisibilityControl(htmlNode)) {
      case "emptyState":
        const emptyStateElement = this.getEmptyStateFor(renderField, htmlNode);
        if (shouldHide) {
          this.hideHTMLElement(htmlNode); // Hide empty field
          this.showHTMLElement(emptyStateElement);
        } else {
          this.hideHTMLElement(emptyStateElement);
          this.renderFieldValue(renderField, htmlNode);
        }
        break;
      case "hideSelf":
        if (shouldHide) {
          this.hideHTMLElement(htmlNode);
        } else {
          this.renderFieldValue(renderField, htmlNode);
        }
        break;
      case "hideAncestor":
        if (shouldHide) {
          this.hideAncestor(renderField.name, htmlNode);
        } else {
          this.renderFieldValue(renderField, htmlNode);
        }
        break;
      case "none":
      default:
        this.renderFieldValue(renderField, htmlNode);
        break;
    }
  }

  /**
   * Render the value of a `renderField` into its corresponding `htmlNode`,
   * based on the type of its value defined through the `type` property defined
   * on the `renderField`.
   */
  private renderFieldValue(renderField: RenderField, htmlNode: HTMLRenderNode): void {
    switch (renderField.type) {
      case "html":
        htmlNode.innerHTML = renderField.value;
        break;
      case "date":
        const formatStr = htmlNode.dataset.dateFormat || "d.M.yyyy";
        htmlNode.innerText = format(new Date(renderField.value), formatStr, {
          locale: de,
        });
        break;
      default:
        htmlNode.innerText = renderField.value;
    }
  }

  /**
   * Recursively reads the DOM node and its descendants to build a structured RenderData.
   * It identifies elements with `data-${elementAttr}-element` and `data-${fieldAttr}-field` attributes,
   * and processes them into `RenderBlock` and `RenderField` objects.
   *
   * @param node The root node to start reading from.
   * @returns `RenderData` An array of `RenderBlock` and `RenderField` objects representing the node structure.
   */
  public read(node: HTMLElement, stopRecursionMatches: string[] = []): RenderData<F> {
    const renderData: RenderData<F> = [];

    Array.from(node.children).forEach((child: HTMLRenderNode) => {
      if (stopRecursionMatches.some((selector) => child.matches(selector))) {
        return; // Stop recursion for this element
      }

      // If it's a RenderBlock
      if (child.hasAttribute(this.attr.block)) {
        renderData.push(this.readRenderBlock(child, stopRecursionMatches));
      }
      // If it's a RenderField
      else if (child.hasAttribute(this.attr.field)) {
        renderData.push(this.readRenderField(child));
      }
      // If it's neither, check if any descendants are renderable
      else {
        const hasRenderableChild =
          child.querySelectorAll(`[${this.attr.block}], [${this.attr.field}]`).length > 0;

        // If there are renderable children, recurse on this child
        if (hasRenderableChild) {
          renderData.push(...this.read(child, stopRecursionMatches));
        }
      }
    });

    return renderData;
  }

  /**
   * Clears the canvas from previous renders and resets the visibility of all
   * elements to its initial state.
   */
  public clear(node: HTMLElement = this.canvas): void {
    /** Check whether the value of a field is allowed to be cleared. */
    const allowedToClear = (child: HTMLRenderNode): boolean => {
      if (child.hasAttribute(this.attr.clear)) {
        return wf.hasAttr(child, this.attr.clear);
      } else {
        return this.options.defaults.clear;
      }
    };

    const collections = node.querySelectorAll<HTMLRenderNode>(
      `${this.blockSelector()}[${this.attr.collection}]`,
    );
    collections.forEach((collection) => {
      const htmlTemplate = collection.firstElementChild.cloneNode(true);
      collection.innerHTML = "";
      collection.appendChild(htmlTemplate);
    });

    const htmlFields = node.querySelectorAll<HTMLRenderNode>(this.fieldSelector());
    htmlFields.forEach((htmlNode) => {
      if (allowedToClear(htmlNode)) htmlNode.innerText = "";
      const nodeName = htmlNode.getAttribute(this.attr.field);
      const fieldVisibility = this.readVisibilityControl(htmlNode);
      if (fieldVisibility === "hideSelf" || fieldVisibility === "emptyState") {
        this.showHTMLElement(htmlNode);
      } else if (fieldVisibility === "hideAncestor") {
        this.showAncestor(nodeName, htmlNode);
      }
    });

    const blocks = node.querySelectorAll<HTMLRenderNode>(this.blockSelector());
    blocks.forEach((htmlNode) => {
      const nodeName = htmlNode.getAttribute(this.attr.field);
      const fieldVisibility = this.readVisibilityControl(htmlNode);
      if (fieldVisibility === "hideSelf" || fieldVisibility === "emptyState") {
        this.showHTMLElement(htmlNode);
      } else if (fieldVisibility === "hideAncestor") {
        this.showAncestor(nodeName, htmlNode);
      }
    });
  }

  private readRenderBlock(
    child: HTMLRenderNode,
    stopRecursionAttributes: string[],
  ): RenderBlock<F> {
    const blockName = child.getAttribute(this.attr.block);
    const instance = child.getAttribute(`data-${blockName}-instance`);

    // Recursively read child elements
    const children = this.read(child, stopRecursionAttributes); // Recurse on children

    const block: RenderBlock<F> = {
      name: blockName!,
      instance: instance || undefined,
      children,
      visibility: wf.isVisible(child),
      decorative: wf.hasAttr(child, this.attr.decorative),
      props: {},
    };

    this.readFilteringProperties(block, child);

    return block;
  }

  private readRenderField(htmlNode: HTMLRenderNode): RenderField<F> {
    const fieldName = htmlNode.getAttribute(this.attr.field);
    const instance = htmlNode.getAttribute(`data-${fieldName}-instance`);

    // Determine field type (handle date, text, html)
    let value: string = htmlNode.innerHTML.trim();
    const type =
      htmlNode.children.length > 0 ? "html" : htmlNode.hasAttribute("data-date") ? "date" : "text";

    switch (type) {
      case "date":
        value = value;
        break;
      default:
        break;
    }

    const field: RenderField<F> = {
      name: fieldName!,
      instance: instance || undefined,
      value,
      type,
      visibility: wf.isVisible(htmlNode),
      decorative: wf.hasAttr(htmlNode, this.attr.decorative),
      props: {},
    };

    // Optionally, handle additional properties for filtering purposes
    this.readFilteringProperties(field, htmlNode);

    return field;
  }

  /**
   * Modifies the `field` properties based on the filtering attributes from `child`.
   * Handles `date` and `boolean` attributes.
   */
  private readFilteringProperties(
    field: RenderField<F> | RenderBlock<F>,
    child: HTMLRenderNode,
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
   * Parse the visibility control attribute value of a `child` that represents
   * a render item in the DOM.
   *
   * # VisibilityControl
   * This tells the `Renderer` wether it should dynamically show or hide a
   * `child`, if the `Renderer` decides it has no critical content.
   *
   * ## Values:
   * - "emptyState": Hides the `child` and shows an empty state tagged with
   *   the `[data-*-empty-state]` attribute. The attribute value tells the
   *   `Renderer` which render item this empty state belongs to.
   *   TODO: Make it clear that it matches RenderNodes and empty states based on the `name` property on the render block or render item.
   *
   * - `true`: Hides the `child`
   * - `false`: Disables the visibility control, meaning no elements get
   *   shown or hidden
   */
  private readVisibilityControl(htmlNode: HTMLRenderNode): VisibilityControl {
    // INFO: This method is also used during the clear process.
    const value = htmlNode.getAttribute(this.attr.visibilityControl)?.trim() as VisibilityControl;

    const validOptions: UnionToTuple<VisibilityControl> = [
      "emptyState",
      "hideSelf",
      "hideAncestor",
      "none",
    ];
    if (validOptions.includes(value)) {
      return value;
    } else {
      return this.options.defaults.visibilityControl;
    }
  }

  private getEmptyStateFor(
    node: RenderBlock<F> | RenderField<F>,
    htmlNode: HTMLRenderNode,
  ): HTMLElement {
    let emptyState: HTMLElement;

    if (Renderer.isRenderField) {
      emptyState = htmlNode.parentElement?.querySelector<HTMLElement>(
        `[${this.attr.emptyState}="${node.name}"]`,
      );
    } else {
      emptyState = htmlNode.querySelector<HTMLElement>(`[${this.attr.emptyState}="${node.name}"]`);
    }

    if (emptyState) return emptyState;
    throw new Error(`${this.lp}No empty state found for "${node.name}"`);
  }

  private shouldHideField(field: RenderField<F>): boolean {
    return !field.visibility || !field.value.trim();
  }

  private shouldHideBlock(block: RenderBlock<F>): boolean {
    if (block.visibility === false) return true;
    // Check if all child blocks and fields are empty
    return block.children.every((child) => {
      if (Renderer.isRenderField(child)) {
        if (child.decorative) return true;
        return !child.value.trim(); // Empty field
      }
      if (Renderer.isRenderBlock(child)) {
        if (child.decorative) return true;
        // Recursively check child nodes
        return child.children.length === 0 ? true : this.shouldHideBlock(child);
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

  private hideHTMLElement(element: HTMLElement): void {
    element.style.display = "none";
  }

  private showNode(nodeName: string, htmlNode: HTMLRenderNode): void {
    this.showHTMLElement(htmlNode);
  }

  private hideNode(nodeName: string, htmlNode: HTMLRenderNode): void {
    this.hideHTMLElement(htmlNode);
  }

  private showAncestor(nodeName: string, htmlNode: HTMLRenderNode): void {
    const ancestor = this.findClosestAncestor(nodeName, htmlNode);

    if (typeof ancestor === "string") {
      console.warn(`${this.lp}Ancestor "${ancestor}" not found for node.`);
    } else {
      this.showHTMLElement(ancestor);
    }
  }

  private hideAncestor(nodeName: string, htmlNode: HTMLRenderNode): void {
    const ancestor = this.findClosestAncestor(nodeName, htmlNode);

    if (typeof ancestor === "string") {
      console.warn(`${this.lp}Ancestor "${ancestor}" not found for node.`);
    } else {
      this.hideHTMLElement(ancestor);
    }
  }

  /**
   * Finds the closest ancestor to show or hide.
   *
   * @returns A HTMLElement if the ancestor was found. The selector string that was expected
   * to find the ancestor, if no ancestor was found.
   */
  private findClosestAncestor(nodeName: string, htmlNode: HTMLRenderNode): HTMLElement | string {
    const selectAncestor = createAttribute(this.attr.inheritVisibility);
    const selector = [
      selectAncestor(nodeName, { matchType: "whitespace" }),
      htmlNode.getAttribute(this.attr.hideAncestor) ?? "",
    ].join(",");
    const ancestor = htmlNode.closest<HTMLElement>(selector);
    return ancestor || selector;
  }

  private hideChildrenExceptEmptyState(parent: HTMLRenderNode): void {
    const nodes = `[${this.attr.block}], [${this.attr.field}]`;
    const emptyStateAttr = `[${this.attr.emptyState}]`;
    const emptyStateChildren = `[${this.attr.emptyState}] *`;
    const selector = exclude(nodes, emptyStateAttr, emptyStateChildren);
    const elements = Array.from(parent.querySelectorAll<HTMLRenderNode>(selector));
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

  private blockSelector(block?: RenderBlock<F>): string {
    const blockAttrSelector = createAttribute(this.attr.block);
    if (!block) {
      return blockAttrSelector();
    }

    let selectorString = blockAttrSelector(block.name);
    if (block.instance) {
      selectorString += this.instanceSelector(block.name, block.instance);
    }
    return selectorString;
  }

  private fieldSelector(field?: RenderField<F>): string {
    const fieldAttrSelector = createAttribute(this.attr.field);
    if (!field) {
      return fieldAttrSelector();
    }

    let selectorString = fieldAttrSelector(field.name);
    if (field.instance) {
      selectorString += this.instanceSelector(field.name, field.instance);
    }
    return selectorString;
  }

  private instanceSelector(node: string, instanceId: string): string {
    return `[data-${node}-instance="${instanceId}"]`;
  }

  // Type Guard for RenderBlock
  private static isRenderBlock<F extends FilterAttributes = {}>(
    item: RenderBlock<F> | RenderField<F>,
  ): item is RenderBlock<F> {
    return (item as RenderBlock<F>).children !== undefined;
  }

  // Type Guard for RenderField
  private static isRenderField<F extends FilterAttributes = {}>(
    item: RenderBlock<F> | RenderField<F>,
  ): item is RenderField<F> {
    return (item as RenderField<F>).value !== undefined;
  }
}
