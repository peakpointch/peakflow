import createAttribute from "../attributeselector/index.js";
import { toCamelCase } from "../utils/parameterize.js";
import { format, parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { de } from "date-fns/locale";
import wf from "../webflow/index.js";
import deepMerge from "../utils/deepmerge.js";
export class Renderer {
    constructor(canvas, options) {
        this.collectionAttr = `data-is-collection`;
        this.attributeName = "render";
        if (!canvas)
            throw new Error(`Canvas can't be undefined.`);
        this.canvas = canvas;
        this.options = deepMerge(Renderer.defaultOptions, options);
        this.attributeName = this.options.attributeName;
        this.elementAttr = `data-${this.attributeName}-element`;
        this.fieldAttr = `data-${this.attributeName}-field`;
        this.emptyStateAttr = `data-${this.attributeName}-empty-state`;
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
    renderElement(renderElement, canvas) {
        const selector = this.elementSelector(renderElement);
        const htmlRenderElements = canvas.querySelectorAll(selector);
        if (!htmlRenderElements.length) {
            console.warn(`Element "${selector}" was not found.`);
            return;
        }
        // Recursion with visibility check
        htmlRenderElements.forEach((htmlRenderElement) => {
            let isCollection = htmlRenderElement.getAttribute(this.collectionAttr) === "true";
            if (isCollection) {
                this.renderCollection(renderElement, htmlRenderElement);
            }
            else {
                this.renderElementToTemplate(renderElement, htmlRenderElement);
            }
        });
    }
    renderCollection(renderElement, htmlRenderCollection) {
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
        if (max === -1)
            max = renderElement.fields.length;
        max = Math.min(renderElement.fields.length, max);
        max = Math.max(max, 0);
        const firstChild = htmlRenderCollection.firstElementChild;
        if (firstChild) {
            const htmlTemplate = firstChild.cloneNode(true);
            htmlRenderCollection.innerHTML = "";
            // Use DocumentFragment for performance improvement
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < max; i++) {
                const template = htmlTemplate.cloneNode(true);
                if (Renderer.isRenderElement(renderElement.fields[i])) {
                    this.renderElementToTemplate(renderElement.fields[i], template);
                }
                else if (Renderer.isRenderField(renderElement.fields[i])) {
                    this.renderFieldToTemplate(renderElement.fields[i], template);
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
     * Render a `RenderElement` to a single `HTMLRenderElement`
     */
    renderElementToTemplate(renderElement, htmlTemplate) {
        switch (this.readVisibilityControl(htmlTemplate)) {
            case "emptyState":
                const emptyStateElement = htmlTemplate.querySelector(`[${this.emptyStateAttr}]`);
                if (this.shouldHideElement(renderElement)) {
                    emptyStateElement.classList.remove("hide");
                    if (emptyStateElement.style.display === "none") {
                        emptyStateElement.style.removeProperty("display");
                    }
                }
                else {
                    emptyStateElement.classList.add("hide");
                    emptyStateElement.style.display = "none";
                }
                // For both cases since the children next to the `emptyStateElement` have to be hidden if the empty state is shown.
                this._render(renderElement.fields, htmlTemplate);
                break;
            case true:
                if (this.shouldHideElement(renderElement)) {
                    this.hideElement(htmlTemplate);
                }
                else {
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
    renderFieldToTemplate(field, htmlTemplate) {
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
        }
        else {
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
    read(node, stopRecursionMatches = []) {
        const renderData = [];
        Array.from(node.children).forEach((child) => {
            if (stopRecursionMatches.some((selector) => child.matches(selector))) {
                return; // Stop recursion for this element
            }
            // If it's a RenderElement
            if (child.hasAttribute(this.elementAttr)) {
                renderData.push(this.readRenderElement(child, stopRecursionMatches));
            }
            // If it's a RenderField
            else if (child.hasAttribute(this.fieldAttr)) {
                renderData.push(this.readRenderField(child));
            }
            // If it's neither, check if any descendants are renderable
            else {
                const hasRenderableChild = child.querySelectorAll(`[${this.elementAttr}], [${this.fieldAttr}]`).length > 0;
                // If there are renderable children, recurse on this child
                if (hasRenderableChild) {
                    renderData.push(...this.read(child, stopRecursionMatches));
                }
            }
        });
        return renderData;
    }
    clear(node = this.canvas) {
        const collections = node.querySelectorAll(`${this.elementSelector()}[${this.collectionAttr}]`);
        collections.forEach((collection) => {
            const template = collection.firstElementChild.cloneNode(true);
            collection.innerHTML = "";
            collection.appendChild(template);
        });
        const fields = node.querySelectorAll(this.fieldSelector());
        fields.forEach((field) => {
            field.innerText = "";
            const fieldVisibility = this.readVisibilityControl(field);
            if (fieldVisibility === true || fieldVisibility === "emptyState") {
                this.showElement(field);
            }
        });
        const elements = node.querySelectorAll(this.elementSelector());
        elements.forEach((element) => {
            this.showElement(element);
        });
    }
    readRenderElement(child, stopRecursionAttributes) {
        const elementName = child.getAttribute(this.elementAttr);
        const instance = child.getAttribute(`data-${elementName}-instance`);
        // Recursively read child elements
        const fields = this.read(child, stopRecursionAttributes); // Recurse on children
        const element = {
            element: elementName,
            fields,
            visibility: true,
            props: {},
        };
        element.instance = instance || undefined;
        if (child.classList.contains(wf.class.invisible) || child.closest(wf.select.invisible)) {
            element.visibility = false;
        }
        else {
            element.visibility = true;
        }
        this.readFilteringProperties(element, child);
        return element;
    }
    readRenderField(child) {
        const fieldName = child.getAttribute(this.fieldAttr);
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
            value,
            type,
            visibility: true,
            props: {},
        };
        field.instance = instance || undefined;
        if (child.classList.contains(wf.class.invisible) || child.closest(wf.select.invisible)) {
            field.visibility = false;
        }
        else {
            field.visibility = true;
        }
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
                            throw new Error(`Can't parse boolean filter: No element found with attribute "[${attr}]". Perhaps you misspelled the attribute?`);
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
     * Parse the visibility control attribute value of a Render-`child`.
     *
     * ### "VisibilityControl" tells the `Renderer` wether it should mess with a `RenderElement`'s or `RenderField`'s visibility
     * - `emptyState`: Shows an empty state if the children are hidden
     * - `true`: Hides the element if there is no content to be shown.
     * - `false`: Disable visibility control, do not mess with the element's visibility.
     */
    readVisibilityControl(child) {
        const visibilityControlAttr = child
            .getAttribute(`data-${this.attributeName}-visibility-control`)
            ?.trim();
        switch (visibilityControlAttr) {
            case "emptyState":
                return "emptyState";
            default:
                return JSON.parse(visibilityControlAttr ?? "false") || false;
        }
    }
    shouldHideElement(element) {
        if (element.visibility === false)
            return true;
        // Check if all child fields and elements are empty
        return element.fields.every((child) => {
            if (Renderer.isRenderField(child)) {
                return !child.value.trim(); // Empty field
            }
            if (Renderer.isRenderElement(child)) {
                return child.fields.length === 0 ? true : this.shouldHideElement(child); // Recursively check child elements
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
    showElement(element) {
        const ancestorToHide = element.getAttribute(`data-${this.attributeName}-hide-ancestor`);
        this.showHTMLElement(element);
        if (ancestorToHide) {
            // Hide the specified ancestor
            const ancestor = element.closest(ancestorToHide);
            if (ancestor) {
                this.showHTMLElement(ancestor);
            }
            else {
                console.warn(`Ancestor "${ancestorToHide}" not found for element.`);
            }
        }
    }
    hideElement(element) {
        const hideSelf = JSON.parse(element.getAttribute(`data-${this.attributeName}-hide-self`) || "false");
        const ancestorToHide = element.getAttribute(`data-${this.attributeName}-hide-ancestor`);
        if (hideSelf) {
            // Hide the element itself
            element.style.display = "none";
        }
        else if (ancestorToHide) {
            // Hide the specified ancestor
            const ancestor = element.closest(ancestorToHide);
            if (ancestor) {
                ancestor.style.display = "none";
            }
            else {
                console.warn(`Ancestor "${ancestorToHide}" not found for element.`);
            }
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
    elementSelector(element) {
        const elementAttrSelector = createAttribute(this.elementAttr);
        if (!element) {
            return elementAttrSelector();
        }
        let selectorString = elementAttrSelector(element.element);
        if (element.instance) {
            selectorString += this.instanceSelector(element.element, element.instance);
        }
        return selectorString;
    }
    fieldSelector(field) {
        const fieldAttrSelector = createAttribute(this.fieldAttr);
        if (!field) {
            return fieldAttrSelector();
        }
        let selectorString = fieldAttrSelector(field.element);
        if (field.instance) {
            selectorString += this.instanceSelector(field.element, field.instance);
        }
        return selectorString;
    }
    instanceSelector(element, instanceId) {
        return `[data-${element}-instance="${instanceId}"]`;
    }
    // Type Guard for RenderElement
    static isRenderElement(item) {
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
};
