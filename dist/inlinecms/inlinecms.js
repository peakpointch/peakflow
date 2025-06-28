import { getAllElements } from "../utils/getelements.js";
const INLINECMS_TARGET_ATTR = `data-inlinecms-target`;
const INLINECMS_COMPONENT_ATTR = `data-inlinecms-component`;
/**
 * Ensures the given container is a valid CMS container.
 * @param container - The container to validate.
 */
function validateContainer(container) {
    if (!container.classList.contains("w-dyn-list")) {
        throw new Error("The element given is not a CMS list: " + container);
    }
}
/**
 * Extracts and appends items from a CMS container to a target element.
 * @param container - The container element to extract items from.
 * @param target - The target element to append items to.
 */
function processItems(container, target) {
    const items = container.querySelectorAll(".w-dyn-item");
    if (items.length === 0) {
        throw new Error(`The container doesn't contain any cms-items.`);
    }
    container.remove();
    items.forEach((item) => {
        item.classList.remove("w-dyn-item");
        target.appendChild(item);
    });
}
/**
 * Extracts the target element from the `data-inlinecms-target` attribute.
 * @param container - The container with the attribute.
 * @returns The target HTMLElement (or throws an error if not found).
 */
function extractTargetFromAttribute(container) {
    const targetSelector = container.getAttribute(INLINECMS_TARGET_ATTR);
    if (!targetSelector) {
        throw new Error(`Container is missing ${INLINECMS_TARGET_ATTR} attribute.`);
    }
    let target;
    if (targetSelector === "parentNode" || targetSelector === "parent" || targetSelector === "parentElement") {
        target = container.parentElement;
    }
    else {
        target = document.querySelector(targetSelector);
    }
    if (!target) {
        throw new Error(`Target element not found with specified selector: "${targetSelector}".`);
    }
    return target;
}
/**
 * General-purpose function to inline CMS items into a target element.
 * @param container - CSS selector or HTMLElement(s) for the container(s).
 * @param target - CSS selector or HTMLElement for the target. If omitted, parent of the container is used.
 */
export function inlineCmsDev(container, target) {
    // Find all container elements
    const containers = getAllElements(container);
    containers.forEach((container, index) => {
        const componentName = container.getAttribute(INLINECMS_COMPONENT_ATTR) || `index ${index}`;
        validateContainer(container);
        // Determine the target element
        const targetElement = target
            ? getAllElements(target)[0]
            : container.parentElement;
        if (!targetElement) {
            throw new Error("Target element not found or specified.");
        }
        try {
            // Process the container and append items to the target
            processItems(container, targetElement);
        }
        catch (e) {
            console.warn(`Inlinecms "${componentName}":`, e.message);
        }
    });
}
/**
 * Processes a NodeList of CMS containers or a CSS selector that matches multiple CMS containers,
 * extracting items into their respective targets.
 * Each container must have a `data-inlinecms-target` attribute.
 * @param containers - A NodeListOf<HTMLElement> or a CSS selector string for CMS container elements.
 */
export function inlineCms(containers) {
    let containerElements;
    if (typeof containers === "string") {
        containerElements = getAllElements(containers);
    }
    else {
        containerElements = Array.from(containers);
    }
    if (containerElements.length === 0) {
        throw new Error(`No containers found matching: ${(typeof containers === "string") ? containers : ''} `);
    }
    containerElements.forEach((container, index) => {
        const componentName = container.getAttribute(INLINECMS_COMPONENT_ATTR) || `index ${index}`;
        validateContainer(container);
        let targetElement;
        try {
            // Extract the target from the container's attribute
            targetElement = extractTargetFromAttribute(container);
        }
        catch (e) {
            console.warn(`Inlinecms "${componentName}":`, e.message, `Setting target to the containers parent.`);
            targetElement = container.parentElement;
        }
        try {
            // Process the container and append items to the target
            processItems(container, targetElement);
        }
        catch (e) {
            console.warn(`Inlinecms "${componentName}":`, e.message);
        }
    });
}
