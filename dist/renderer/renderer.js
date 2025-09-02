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
        const htmlRenderBlocks = canvas.querySelectorAll(selector);
        if (!htmlRenderBlocks.length) {
            console.warn(`Block "${selector}" was not found.`);
            return;
        }
        // Recursion with visibility check
        htmlRenderBlocks.forEach((htmlRenderBlock) => {
            let isCollection = htmlRenderBlock.getAttribute(this.attr.collection) === "true";
            if (isCollection) {
                this.renderCollection(renderBlock, htmlRenderBlock);
            }
            else {
                this.renderBlockToTemplate(renderBlock, htmlRenderBlock);
            }
        });
    }
    renderCollection(renderBlock, htmlRenderCollection) {
        switch (this.readVisibilityControl(htmlRenderCollection)) {
            case "emptyState":
                // TODO: Support "emptyState" for render collections
                break;
            case true:
                if (this.shouldHideBlock(renderBlock)) {
                    this.hideNode(htmlRenderCollection);
                    return;
                }
                break;
            case false:
            default:
                break;
        }
        let max = parseInt(htmlRenderCollection.getAttribute("data-limit-items") || "-1");
        if (max === -1)
            max = renderBlock.fields.length;
        max = Math.min(renderBlock.fields.length, max);
        max = Math.max(max, 0);
        const firstChild = htmlRenderCollection.firstElementChild;
        if (firstChild) {
            const htmlTemplate = firstChild.cloneNode(true);
            htmlRenderCollection.innerHTML = "";
            // Use DocumentFragment for performance improvement
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < max; i++) {
                const template = htmlTemplate.cloneNode(true);
                if (Renderer.isRenderBlock(renderBlock.fields[i])) {
                    this.renderBlockToTemplate(renderBlock.fields[i], template);
                }
                else if (Renderer.isRenderField(renderBlock.fields[i])) {
                    this.renderFieldToTemplate(renderBlock.fields[i], template);
                }
                fragment.appendChild(template);
            }
            htmlRenderCollection.appendChild(fragment);
        }
        else {
            console.warn("No first child found to clone");
        }
    }
    /**
     * Render a `RenderBlock` to a single `HTMLRenderBlock`
     */
    renderBlockToTemplate(renderBlock, htmlTemplate) {
        switch (this.readVisibilityControl(htmlTemplate)) {
            case "emptyState":
                const emptyStateElement = this.getEmptyStateFor(renderBlock, htmlTemplate);
                if (this.shouldHideBlock(renderBlock)) {
                    this.hideChildrenExceptEmptyState(htmlTemplate);
                    this.showHTMLElement(emptyStateElement);
                    const children = emptyStateElement.querySelectorAll(`[${this.attr.block}], [${this.attr.field}]`);
                    const childrenElementTypes = Array.from(children).map((el) => el.hasAttribute(this.attr.block)
                        ? el.getAttribute(this.attr.block)
                        : el.getAttribute(this.attr.field));
                    const fields = renderBlock.fields.filter((field) => childrenElementTypes.includes(field.element));
                    // Only render fields and blocks that are inside the empty state element
                    this._render(fields, emptyStateElement);
                }
                else {
                    this.hideHTMLElement(emptyStateElement);
                    this._render(renderBlock.fields, htmlTemplate);
                }
                break;
            case true:
                if (this.shouldHideBlock(renderBlock)) {
                    this.hideNode(htmlTemplate);
                }
                else {
                    this._render(renderBlock.fields, htmlTemplate); // Recursively render children
                }
                break;
            case false:
            default:
                this._render(renderBlock.fields, htmlTemplate); // Recursively render children
                break;
        }
    }
    /**
     * Render a `RenderField` to all its instances
     */
    renderField(renderField, canvas) {
        const selector = this.fieldSelector(renderField);
        const fields = canvas.querySelectorAll(selector);
        fields.forEach((htmlRenderField) => {
            this.renderFieldToTemplate(renderField, htmlRenderField);
        });
    }
    /**
     * Render a `RenderField` to a single `HTMLRenderField`
     */
    renderFieldToTemplate(renderField, htmlTemplate) {
        const isVisible = !renderField.visibility || !renderField.value.trim();
        switch (this.readVisibilityControl(htmlTemplate)) {
            case "emptyState":
                const emptyStateElement = this.getEmptyStateFor(renderField, htmlTemplate);
                if (isVisible) {
                    this.hideNode(htmlTemplate); // Hide empty field
                    this.showHTMLElement(emptyStateElement);
                }
                else {
                    this.hideHTMLElement(emptyStateElement);
                    this.renderFieldValue(renderField, htmlTemplate);
                }
                break;
            case true:
                if (isVisible) {
                    this.hideNode(htmlTemplate); // Hide empty field
                }
                else {
                    this.renderFieldValue(renderField, htmlTemplate);
                }
                break;
            case false:
            default:
                this.renderFieldValue(renderField, htmlTemplate);
                break;
        }
    }
    /**
     * Render the value of a `renderField` into its corresponding `htmlTemplate`,
     * based on the type of its value defined through the `type` property defined
     * on the `renderField`.
     */
    renderFieldValue(renderField, htmlTemplate) {
        switch (renderField.type) {
            case "html":
                htmlTemplate.innerHTML = renderField.value;
                break;
            case "date":
                const formatStr = htmlTemplate.dataset.dateFormat || "d.M.yyyy";
                htmlTemplate.innerText = format(new Date(renderField.value), formatStr, {
                    locale: de,
                });
                break;
            default:
                htmlTemplate.innerText = renderField.value;
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
            const template = collection.firstElementChild.cloneNode(true);
            collection.innerHTML = "";
            collection.appendChild(template);
        });
        const fields = node.querySelectorAll(this.fieldSelector());
        fields.forEach((field) => {
            if (allowedToClear(field))
                field.innerText = "";
            field.innerText = "";
            const fieldVisibility = this.readVisibilityControl(field);
            if (fieldVisibility === true || fieldVisibility === "emptyState") {
                this.showNode(field);
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
        const fields = this.read(child, stopRecursionAttributes); // Recurse on children
        const block = {
            element: blockName,
            instance: instance || undefined,
            fields,
            visibility: wf.isVisible(child),
            decorative: wf.hasAttr(child, this.attr.decorative),
            props: {},
        };
        this.readFilteringProperties(block, child);
        return block;
    }
    readRenderField(child) {
        const fieldName = child.getAttribute(this.attr.field);
        const instance = child.getAttribute(`data-${fieldName}-instance`);
        // Determine field type (handle date, text, html)
        let value = child.innerHTML.trim();
        const type = child.children.length > 0 ? "html" : child.hasAttribute("data-date") ? "date" : "text";
        switch (type) {
            case "date":
                value = value;
                break;
            default:
                break;
        }
        const field = {
            element: fieldName,
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
     *   TODO: Make it clear that it matches RenderNodes and empty states based on the `element` property on the render block or render item.
     *
     * - `true`: Hides the `child`
     * - `false`: Disables the visibility control, meaning no elements get
     *   shown or hidden
     */
    readVisibilityControl(child) {
        // INFO: This method is also used during the clear process.
        const raw = child
            .getAttribute(this.attr.visibilityControl)
            ?.trim();
        if (raw === "emptyState") {
            return "emptyState";
        }
        else if (child.hasAttribute(this.attr.visibilityControl)) {
            return wf.hasAttr(child, this.attr.visibilityControl);
        }
        else {
            return this.options.defaults.visibilityControl;
        }
    }
    getEmptyStateFor(node, template) {
        let emptyState;
        if (Renderer.isRenderField) {
            emptyState = template.parentElement?.querySelector(`[${this.attr.emptyState}="${node.element}"]`);
        }
        else {
            emptyState = template.querySelector(`[${this.attr.emptyState}="${node.element}"]`);
        }
        if (emptyState)
            return emptyState;
        throw new Error(`${this.lp}No empty state found for "${node.element}"`);
    }
    shouldHideBlock(block) {
        if (block.visibility === false)
            return true;
        // Check if all child blocks and fields are empty
        return block.fields.every((child) => {
            if (Renderer.isRenderField(child)) {
                if (child.decorative)
                    return true;
                return !child.value.trim(); // Empty field
            }
            if (Renderer.isRenderBlock(child)) {
                if (child.decorative)
                    return true;
                // Recursively check child nodes
                return child.fields.length === 0 ? true : this.shouldHideBlock(child);
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
    showNode(node) {
        const ancestorToHide = node.getAttribute(this.attr.hideAncestor);
        this.showHTMLElement(node);
        if (ancestorToHide) {
            // Hide the specified ancestor
            const ancestor = node.closest(ancestorToHide);
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
        let selectorString = blockAttrSelector(block.element);
        if (block.instance) {
            selectorString += this.instanceSelector(block.element, block.instance);
        }
        return selectorString;
    }
    fieldSelector(field) {
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
    instanceSelector(node, instanceId) {
        return `[data-${node}-instance="${instanceId}"]`;
    }
    // Type Guard for RenderBlock
    static isRenderBlock(item) {
        return item.fields !== undefined;
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
