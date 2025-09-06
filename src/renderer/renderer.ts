import { format, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { de } from "date-fns/locale";
import type { PartialDeep } from "type-fest";

import Path from "../path/index.js";
import wf from "../webflow/index.js";
import { createAttribute, exclude } from "../attributeselector/index.js";
import { deepMerge, toCamelCase, asPrefix, asSuffix, logPrefix } from "../utils/index.js";

import { HTMLRenderNode, HTMLRenderField, HTMLRenderBlock } from "./dom/index.js";
import type {
  RenderData,
  RenderField,
  RenderBlock,
  RendererOptions,
  RendererWarnings,
  RenderAttributes,
  FilterAttributes,
  VisibilityControl,
  RenderFieldType,
} from "./types.js";

export class Renderer<F extends FilterAttributes<keyof F & string> = {}> {
  public static readonly defaultOptions: RendererOptions = {
    attributeName: "render",
    filterAttributes: {},
    timezone: false,
    defaults: {
      visibilityControl: "none",
      clear: true,
    },
    warnings: {
      autolog: true,
      omit: {
        missingBlocks: false,
        missingFields: true,
      },
    },
  };

  public options: RendererOptions<F>;

  /**
   * The path keeps track of where the renderer is currently rendering.
   *
   * @example "weekday.Tuesday.dish"
   */
  public readonly path: Path = new Path();

  public attr: RenderAttributes;
  public data: RenderData<F>;

  private canvas: HTMLElement;
  private currentData: RenderData<F>;
  private lp: string = "Renderer:";
  private attributeName: string = "render";
  private warnings: RendererWarnings = {
    missingBlocks: [],
    missingFields: [],
  };

  constructor(canvas: HTMLElement | null, options?: PartialDeep<RendererOptions<F>>) {
    if (!canvas) throw new Error(`${this.lp}Canvas can't be undefined.`);
    this.canvas = canvas;
    this.options = deepMerge(Renderer.defaultOptions as RendererOptions<F>, options);

    this.attributeName = this.options.attributeName;
    this.attr = Renderer.getAttributes(this.attributeName);
    this.lp = logPrefix("Renderer", this.attributeName);
  }

  public static defineAttributes<T extends FilterAttributes>(obj: T): T {
    return obj;
  }

  public static getAttributes(
    attributeName: string = Renderer.defaultOptions.attributeName,
  ): RenderAttributes {
    return {
      block: `data-${attributeName}-element`,
      field: `data-${attributeName}-field`,
      emptyState: `data-${attributeName}-empty-state`,
      collection: `data-${attributeName}-collection`,
      decorative: `data-${attributeName}-decorative`,
      hideAncestor: `data-${attributeName}-hide-ancestor`,
      inheritVisibility: `data-${attributeName}-inherit-visibility`,
      visibilityControl: `data-${attributeName}-visibility-control`,
      invisible: `data-${attributeName}-invisible`,
      clear: `data-${attributeName}-clear`,
    };
  }

  public logWarnings(...keys: (keyof RendererWarnings)[]): Partial<RendererWarnings> {
    let ownKeys = Array.from(keys);
    if (!ownKeys.length) ownKeys = Object.keys(this.warnings) as (keyof RendererWarnings)[];

    const collectedWarnings: Partial<RendererWarnings> = {};

    for (const key of ownKeys) {
      const warnings = this.warnings[key];
      const omitWarning = this.options.warnings.omit[key];
      if (!warnings.length || omitWarning) continue;
      collectedWarnings[key] = warnings;

      const lines: string[] = [];
      const styles: string[] = [];

      warnings.forEach((warning) => {
        const line = `%c${warning.message}: %c${warning.node.name}${asSuffix(
          warning.node.instance,
          ".",
        )} %cat %c${warning.path}`;

        lines.push(line);

        // push styles for the 3 %c in this line
        styles.push(""); // warning message
        styles.push("color: #f19116; font-weight: bold;"); // node name
        styles.push("color: gray;"); // "at"
        styles.push("color: #f19116; font-weight: bold;"); // path
      });

      // join all lines with newlines
      console.warn(`${this.lp}${warnings.length} ${key}\n${lines.join("\n")}`, ...styles);
    }

    return collectedWarnings;
  }

  public clearWarnings(...keys: (keyof RendererWarnings)[]): void {
    let ownKeys = Array.from(keys);
    if (!ownKeys.length) ownKeys = Object.keys(this.warnings) as (keyof RendererWarnings)[];

    for (const key of ownKeys) {
      this.warnings[key] = [];
    }
  }

  public render(data: RenderData<F>, canvas: HTMLElement = this.canvas): void {
    this.data = data;
    if (this.options.warnings.autolog) this.clearWarnings();
    this.clear(canvas);
    this.path.withPath(asPrefix(this.options.pathPrefix), () => {
      this._render(data, canvas);
    });
    if (this.options.warnings.autolog) this.logWarnings();
  }

  private _render(data: RenderData<F>, canvas: HTMLElement = this.canvas): void {
    this.currentData = data;

    this.currentData.forEach((renderItem) => {
      this.assertNoSpaces(renderItem.name);

      this.path.withSegment(renderItem.name, () => {
        this.path.downSafe(renderItem.instance);

        if (Renderer.isRenderBlock(renderItem)) this.renderBlock(renderItem, canvas);
        if (Renderer.isRenderField(renderItem)) this.renderField(renderItem, canvas);
      });
    });
  }

  private assertNoSpaces(str: string): void {
    if (/\s/.test(str)) {
      throw new TypeError(`${this.lp}RenderNode name must not contain spaces: "${str}"`);
    }
  }

  /**
   * Render a `RenderBlock` to all its instances
   */
  private renderBlock(renderBlock: RenderBlock<F>, canvas: HTMLElement) {
    const selector = this.blockSelector(renderBlock);
    const htmlNodes = canvas.querySelectorAll<HTMLRenderNode>(selector);

    if (!htmlNodes.length) {
      this.warnings.missingBlocks.push({
        path: this.path.toString(),
        message: `Block missing`,
        node: renderBlock,
      });
      return;
    }

    // Recursion with visibility check
    htmlNodes.forEach((htmlRenderBlock) => {
      let isCollection = wf.hasAttr(htmlRenderBlock, this.attr.collection);
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
          this.hideNode(renderBlock.name, htmlNode);
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
        const htmlItemNode = htmlTemplate.cloneNode(true) as HTMLRenderNode;
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
        let inheritedIsVisible = this.readInheritedVisibility(emptyState);
        if (shouldHide && inheritedIsVisible) {
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
          this.hideNode(renderBlock.name, htmlNode);
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

    if (!htmlFields.length) {
      this.warnings.missingFields.push({
        path: this.path.toString(),
        message: `Field missing`,
        node: renderField,
      });
      return;
    }

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
          this.hideNode(renderField.name, htmlNode);
          this.showHTMLElement(emptyStateElement);
        } else {
          this.hideHTMLElement(emptyStateElement);
          this.renderFieldValue(renderField, htmlNode);
        }
        break;
      case "hideSelf":
        if (shouldHide) {
          this.hideNode(renderField.name, htmlNode);
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
        this.path.withSnapshot(() => {
          renderData.push(this.readRenderBlock(child, stopRecursionMatches));
        });
      }
      // If it's a RenderField
      else if (child.hasAttribute(this.attr.field)) {
        this.path.withSnapshot(() => {
          renderData.push(this.readRenderField(child));
        });
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
        this.showNode(nodeName, htmlNode);
      } else if (fieldVisibility === "hideAncestor") {
        this.showAncestor(nodeName, htmlNode);
      }
    });

    const blocks = node.querySelectorAll<HTMLRenderNode>(this.blockSelector());
    blocks.forEach((htmlNode) => {
      const nodeName = htmlNode.getAttribute(this.attr.field);
      const fieldVisibility = this.readVisibilityControl(htmlNode);
      if (fieldVisibility === "hideSelf" || fieldVisibility === "emptyState") {
        this.showNode(nodeName, htmlNode);
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

    this.path.down(blockName);
    this.path.downSafe(instance);

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

    try {
      this.assertNoSpaces(block.name);
    } catch (err) {
      throw new TypeError(
        `${this.lp}Error reading RenderBlock: The attribute value of "${this.attr.block}" must not contain spaces: "${block.name}"`,
      );
    }

    return block;
  }

  private readRenderField(htmlNode: HTMLRenderNode): RenderField<F> {
    const fieldName = htmlNode.getAttribute(this.attr.field);
    const instance = htmlNode.getAttribute(`data-${fieldName}-instance`);
    this.path.down(fieldName);
    this.path.downSafe(instance);

    const type: RenderFieldType =
      htmlNode.children.length > 0 ? "html" : htmlNode.hasAttribute("data-date") ? "date" : "text";

    let field: RenderField<F>;

    switch (type) {
      default:
        field = {
          name: fieldName!,
          instance: instance || undefined,
          value: htmlNode.innerHTML.trim(),
          type,
          visibility: wf.isVisible(htmlNode),
          decorative: wf.hasAttr(htmlNode, this.attr.decorative),
          props: {},
        };
        break;
    }

    // Optionally, handle additional properties for filtering purposes
    this.readFilteringProperties(field, htmlNode);

    try {
      this.assertNoSpaces(field.name);
    } catch (err) {
      throw new TypeError(
        `${this.lp}Error reading RenderField: The attribute value of "${this.attr.field}" must not contain spaces: "${field.name}"`,
      );
    }

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

    const validOptions: VisibilityControl[] = ["emptyState", "hideSelf", "hideAncestor", "none"];
    if (validOptions.includes(value)) {
      return value;
    } else {
      return this.options.defaults.visibilityControl;
    }
  }

  private readInheritedVisibility(htmlElement: HTMLElement): boolean {
    if (htmlElement.hasAttribute(this.attr.inheritVisibility)) {
      const targetName = htmlElement.getAttribute(this.attr.inheritVisibility);
      const targetSelector = `${this.blockSelector(targetName)}, ${this.fieldSelector(targetName)}`;
      const targetHTMLNode = htmlElement.querySelector<HTMLRenderNode>(targetSelector);
      return this.readVisibility(targetHTMLNode);
    } else {
      return true;
    }
  }

  private readVisibility(htmlNode: HTMLRenderNode): boolean {
    return !wf.hasAttr(htmlNode, this.attr.invisible);
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
    htmlNode.removeAttribute(this.attr.invisible);
  }

  private hideNode(nodeName: string, htmlNode: HTMLRenderNode): void {
    this.hideHTMLElement(htmlNode);
    htmlNode.setAttribute(this.attr.invisible, "");
  }

  private showAncestor(nodeName: string, htmlNode: HTMLRenderNode): void {
    //  NOTE: Needed for 'inherit-visibility' to work
    this.showNode(nodeName, htmlNode);
    const ancestor = this.findClosestAncestor(nodeName, htmlNode);

    if (typeof ancestor === "string") {
      console.warn(`${this.lp}Ancestor "${ancestor}" not found for node.`);
    } else if (this.isHTMLRenderBlock(ancestor)) {
      const ancestorNode = this.readRenderBlock(ancestor, []);
      this.showNode(ancestorNode.name, ancestor);
    } else if (this.isHTMLRenderField(ancestor)) {
      const ancestorNode = this.readRenderField(ancestor);
      this.showNode(ancestorNode.name, ancestor);
    } else {
      this.showHTMLElement(ancestor);
    }
  }

  private hideAncestor(nodeName: string, htmlNode: HTMLRenderNode): void {
    //  NOTE: Needed for 'inherit-visibility' to work
    this.hideNode(nodeName, htmlNode);
    const ancestor = this.findClosestAncestor(nodeName, htmlNode);

    if (typeof ancestor === "string") {
      console.warn(`${this.lp}Ancestor "${ancestor}" not found for node.`);
    } else if (this.isHTMLRenderBlock(ancestor)) {
      const ancestorNode = this.readRenderBlock(ancestor, []);
      this.hideNode(ancestorNode.name, ancestor);
    } else if (this.isHTMLRenderField(ancestor)) {
      const ancestorNode = this.readRenderField(ancestor);
      this.hideNode(ancestorNode.name, ancestor);
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
    ]
      .filter(Boolean)
      .join(",");
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

  private blockSelector(block?: RenderBlock<F> | string): string {
    const blockAttrSelector = createAttribute(this.attr.block);
    if (!block) {
      return blockAttrSelector();
    } else if (typeof block === "string") {
      return blockAttrSelector(block);
    }

    let selectorString = blockAttrSelector(block.name);
    if (block.instance) {
      selectorString += this.instanceSelector(block.name, block.instance);
    }
    return selectorString;
  }

  private fieldSelector(field?: RenderField<F> | string): string {
    const fieldAttrSelector = createAttribute(this.attr.field);
    if (!field) {
      return fieldAttrSelector();
    } else if (typeof field === "string") {
      return fieldAttrSelector(field);
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

  public isHTMLRenderNode(element: HTMLElement): element is HTMLRenderNode {
    return this.isHTMLRenderBlock(element) || this.isHTMLRenderField(element);
  }

  public isHTMLRenderBlock(element: HTMLElement): element is HTMLRenderBlock {
    return wf.hasAttr(element, this.attr.block);
  }

  public isHTMLRenderField(element: HTMLElement): element is HTMLRenderField {
    return wf.hasAttr(element, this.attr.field);
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
