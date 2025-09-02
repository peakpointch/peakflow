import createAttribute, { exclude } from "../attributeselector/index.js";
import { toCamelCase } from "../utils/parameterize.js";
import { format, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { de } from "date-fns/locale";
import wf from "../webflow/index.js";
import deepMerge from "../utils/deepmerge.js";
import { logPrefix } from "../utils/logger.js";
export class Renderer {
    constructor(canvas, options) {
        this.lp = "Renderer:";
        this.attributeName = "render";
        if (!canvas)
            throw new Error(`${this.lp}Canvas can't be undefined.`);
        this.canvas = canvas;
        this.options = deepMerge(Renderer.defaultOptions, options);
        this.attributeName = this.options.attributeName;
        this.attr = {
            block: `data-${this.attributeName}-element`,
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
    static defineAttributes(obj) {
        return obj;
    }
    render(data, canvas = this.canvas) {
        this.clear(canvas);
        this._render(data, canvas);
    }
    _render(data, canvas = this.canvas) {
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
    renderBlock(renderBlock, canvas) {
        const selector = this.blockSelector(renderBlock);
        const htmlNodes = canvas.querySelectorAll(selector);
        if (!htmlNodes.length) {
            console.warn(`Block "${selector}" was not found.`);
            return;
        }
        // Recursion with visibility check
        htmlNodes.forEach((htmlRenderBlock) => {
            let isCollection = htmlRenderBlock.getAttribute(this.attr.collection) === "true";
            if (isCollection) {
                this.renderCollection(renderBlock, htmlRenderBlock);
            }
            else {
                this.renderBlockToTemplate(renderBlock, htmlRenderBlock);
            }
        });
    }
    renderCollection(renderBlock, htmlNode) {
        switch (this.readVisibilityControl(htmlNode)) {
            case "emptyState":
                // TODO: Support "emptyState" for render collections
                break;
            case true:
                if (this.shouldHideBlock(renderBlock)) {
                    this.hideNode(htmlNode);
                    return;
                }
                break;
            case false:
            default:
                break;
        }
        let max = parseInt(htmlNode.getAttribute("data-limit-items") || "-1");
        if (max === -1)
            max = renderBlock.children.length;
        max = Math.min(renderBlock.children.length, max);
        max = Math.max(max, 0);
        const firstChild = htmlNode.firstElementChild;
        if (firstChild) {
            const htmlTemplate = firstChild.cloneNode(true);
            htmlNode.innerHTML = "";
            // Use DocumentFragment for performance improvement
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < max; i++) {
                const htmlItemNode = htmlTemplate.cloneNode(true);
                if (Renderer.isRenderBlock(renderBlock.children[i])) {
                    this.renderBlockToTemplate(renderBlock.children[i], htmlItemNode);
                }
                else if (Renderer.isRenderField(renderBlock.children[i])) {
                    this.renderFieldToTemplate(renderBlock.children[i], htmlItemNode);
                }
                fragment.appendChild(htmlItemNode);
            }
            htmlNode.appendChild(fragment);
        }
        else {
            console.warn("No first child found to clone");
        }
    }
    /**
     * Render a `RenderBlock` to a single `HTMLRenderNode`
     */
    renderBlockToTemplate(renderBlock, htmlNode) {
        switch (this.readVisibilityControl(htmlNode)) {
            case "emptyState":
                const emptyState = this.getEmptyStateFor(renderBlock, htmlNode);
                if (this.shouldHideBlock(renderBlock)) {
                    this.hideChildrenExceptEmptyState(htmlNode);
                    this.showHTMLElement(emptyState);
                    // Only render nodes that are inside the empty state element
                    const emptyStateNodes = this.getChildrenForContainer(renderBlock, emptyState);
                    this._render(emptyStateNodes, emptyState);
                }
                else {
                    this.hideHTMLElement(emptyState);
                    this._render(renderBlock.children, htmlNode);
                }
                break;
            case true:
                if (this.shouldHideBlock(renderBlock)) {
                    this.hideNode(htmlNode);
                }
                else {
                    this._render(renderBlock.children, htmlNode); // Recursively render children
                }
                break;
            case false:
            default:
                this._render(renderBlock.children, htmlNode); // Recursively render children
                break;
        }
    }
    /**
     * Returns the subset of children of a RenderBlock that correspond
     * to elements inside the given container element.
     */
    getChildrenForContainer(block, container) {
        const htmlChildren = container.querySelectorAll(`[${this.attr.block}], [${this.attr.field}]`);
        const names = Array.from(htmlChildren).map((el) => el.hasAttribute(this.attr.block)
            ? el.getAttribute(this.attr.block)
            : el.getAttribute(this.attr.field));
        return block.children.filter((child) => names.includes(child.name));
    }
    /**
     * Render a `RenderField` to all its instances
     */
    renderField(renderField, canvas) {
        const selector = this.fieldSelector(renderField);
        const htmlFields = canvas.querySelectorAll(selector);
        htmlFields.forEach((htmlNode) => {
            this.renderFieldToTemplate(renderField, htmlNode);
        });
    }
    /**
     * Render a `RenderField` to a single `HTMLRenderField`
     */
    renderFieldToTemplate(renderField, htmlNode) {
        const isVisible = !renderField.visibility || !renderField.value.trim();
        switch (this.readVisibilityControl(htmlNode)) {
            case "emptyState":
                const emptyStateElement = this.getEmptyStateFor(renderField, htmlNode);
                if (isVisible) {
                    this.hideNode(htmlNode); // Hide empty field
                    this.showHTMLElement(emptyStateElement);
                }
                else {
                    this.hideHTMLElement(emptyStateElement);
                    this.renderFieldValue(renderField, htmlNode);
                }
                break;
            case true:
                if (isVisible) {
                    this.hideNode(htmlNode); // Hide empty field
                }
                else {
                    this.renderFieldValue(renderField, htmlNode);
                }
                break;
            case false:
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
    renderFieldValue(renderField, htmlNode) {
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
    read(node, stopRecursionMatches = []) {
        const renderData = [];
        Array.from(node.children).forEach((child) => {
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
                const hasRenderableChild = child.querySelectorAll(`[${this.attr.block}], [${this.attr.field}]`).length > 0;
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
    clear(node = this.canvas) {
        /** Check whether the value of a field is allowed to be cleared. */
        const allowedToClear = (child) => {
            if (child.hasAttribute(this.attr.clear)) {
                return wf.hasAttr(child, this.attr.clear);
            }
            else {
                return this.options.defaults.clear;
            }
        };
        const collections = node.querySelectorAll(`${this.blockSelector()}[${this.attr.collection}]`);
        collections.forEach((collection) => {
            const htmlTemplate = collection.firstElementChild.cloneNode(true);
            collection.innerHTML = "";
            collection.appendChild(htmlTemplate);
        });
        const htmlFields = node.querySelectorAll(this.fieldSelector());
        htmlFields.forEach((htmlNode) => {
            if (allowedToClear(htmlNode))
                htmlNode.innerText = "";
            htmlNode.innerText = "";
            const fieldVisibility = this.readVisibilityControl(htmlNode);
            if (fieldVisibility === true || fieldVisibility === "emptyState") {
                this.showNode(htmlNode);
            }
        });
        const blocks = node.querySelectorAll(this.blockSelector());
        blocks.forEach((block) => {
            this.showNode(block);
        });
    }
    readRenderBlock(child, stopRecursionAttributes) {
        const blockName = child.getAttribute(this.attr.block);
        const instance = child.getAttribute(`data-${blockName}-instance`);
        // Recursively read child elements
        const children = this.read(child, stopRecursionAttributes); // Recurse on children
        const block = {
            name: blockName,
            instance: instance || undefined,
            children,
            visibility: wf.isVisible(child),
            decorative: wf.hasAttr(child, this.attr.decorative),
            props: {},
        };
        this.readFilteringProperties(block, child);
        return block;
    }
    readRenderField(htmlNode) {
        const fieldName = htmlNode.getAttribute(this.attr.field);
        const instance = htmlNode.getAttribute(`data-${fieldName}-instance`);
        // Determine field type (handle date, text, html)
        let value = htmlNode.innerHTML.trim();
        const type = htmlNode.children.length > 0 ? "html" : htmlNode.hasAttribute("data-date") ? "date" : "text";
        switch (type) {
            case "date":
                value = value;
                break;
            default:
                break;
        }
        const field = {
            name: fieldName,
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
    readFilteringProperties(field, child) {
        for (let [attr, type] of Object.entries(this.options.filterAttributes)) {
            if (!child.hasAttribute(attr)) {
                continue;
            }
            let value = child.getAttribute(attr);
            if (!value) {
                continue;
            }
            switch (type) {
                case "date":
                    let parsedDate;
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
                            throw new Error(`${this.lp}Can't parse boolean filter: No element found with attribute "[${attr}]". Perhaps you misspelled the attribute?`);
                        }
                        value = Boolean(!targetElement.classList.contains(wf.class.invisible));
                    }
                    else {
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
    readVisibilityControl(htmlNode) {
        // INFO: This method is also used during the clear process.
        const raw = htmlNode
            .getAttribute(this.attr.visibilityControl)
            ?.trim();
        if (raw === "emptyState") {
            return "emptyState";
        }
        else if (htmlNode.hasAttribute(this.attr.visibilityControl)) {
            return wf.hasAttr(htmlNode, this.attr.visibilityControl);
        }
        else {
            return this.options.defaults.visibilityControl;
        }
    }
    getEmptyStateFor(node, htmlNode) {
        let emptyState;
        if (Renderer.isRenderField) {
            emptyState = htmlNode.parentElement?.querySelector(`[${this.attr.emptyState}="${node.name}"]`);
        }
        else {
            emptyState = htmlNode.querySelector(`[${this.attr.emptyState}="${node.name}"]`);
        }
        if (emptyState)
            return emptyState;
        throw new Error(`${this.lp}No empty state found for "${node.name}"`);
    }
    shouldHideBlock(block) {
        if (block.visibility === false)
            return true;
        // Check if all child blocks and fields are empty
        return block.children.every((child) => {
            if (Renderer.isRenderField(child)) {
                if (child.decorative)
                    return true;
                return !child.value.trim(); // Empty field
            }
            if (Renderer.isRenderBlock(child)) {
                if (child.decorative)
                    return true;
                // Recursively check child nodes
                return child.children.length === 0 ? true : this.shouldHideBlock(child);
            }
            return false; // Default case
        });
    }
    showHTMLElement(element) {
        if (element.style.display === "none") {
            element.style.removeProperty("display");
        }
        if (element.classList.contains("hide")) {
            element.classList.remove("hide");
        }
    }
    showNode(htmlNode) {
        const ancestorToHide = htmlNode.getAttribute(this.attr.hideAncestor);
        this.showHTMLElement(htmlNode);
        if (ancestorToHide) {
            // Hide the specified ancestor
            const ancestor = htmlNode.closest(ancestorToHide);
            if (ancestor) {
                this.showHTMLElement(ancestor);
            }
            else {
                console.warn(`Ancestor "${ancestorToHide}" not found for element.`);
            }
        }
    }
    hideHTMLElement(element) {
        element.style.display = "none";
    }
    hideNode(node) {
        const hideSelf = wf.hasAttr(node, this.attr.hideSelf);
        const ancestorToHide = node.getAttribute(this.attr.hideAncestor);
        if (hideSelf) {
            // Hide the element itself
            this.hideHTMLElement(node);
        }
        else if (ancestorToHide) {
            // Hide the specified ancestor
            const ancestor = node.closest(ancestorToHide);
            if (ancestor) {
                this.hideHTMLElement(ancestor);
            }
            else {
                console.warn(`${this.lp}Ancestor "${ancestorToHide}" not found for node.`);
            }
        }
    }
    hideChildrenExceptEmptyState(parent) {
        const nodes = `[${this.attr.block}], [${this.attr.field}]`;
        const emptyStateAttr = `[${this.attr.emptyState}]`;
        const emptyStateChildren = `[${this.attr.emptyState}] *`;
        const selector = exclude(nodes, emptyStateAttr, emptyStateChildren);
        const elements = Array.from(parent.querySelectorAll(selector));
        for (const el of elements) {
            this.hideHTMLElement(el);
        }
    }
    // Method to add filter attributes
    addFilterAttributes(newAttributes) {
        Object.assign(this.options.filterAttributes, newAttributes);
    }
    // Method to remove filter attributes
    removeFilterAttributes(...attributesToRemove) {
        attributesToRemove.forEach((attr) => {
            delete this.options.filterAttributes[attr];
        });
    }
    blockSelector(block) {
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
    fieldSelector(field) {
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
    instanceSelector(node, instanceId) {
        return `[data-${node}-instance="${instanceId}"]`;
    }
    // Type Guard for RenderBlock
    static isRenderBlock(item) {
        return item.children !== undefined;
    }
    // Type Guard for RenderField
    static isRenderField(item) {
        return item.value !== undefined;
    }
}
Renderer.defaultOptions = {
    attributeName: "render",
    filterAttributes: {},
    timezone: false,
    defaults: {
        visibilityControl: false,
        clear: true,
    },
};
