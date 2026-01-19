import { getAllElements } from "../utils/getelements.js";
const INLINECMS_TARGET_ATTR = `data-inlinecms-target`;
const INLINECMS_COMPONENT_ATTR = `data-inlinecms-component`;
/**
 * Ensures the given origin is a valid CMS collection.
 * @param origin - The wrapper to validate.
 */
function validateOrigin(origin) {
    if (!origin.classList.contains("w-dyn-list")) {
        throw new Error("The element given is not a CMS list: " + origin);
    }
}
/**
 * Extracts and appends items from a CMS wrapper to a target element.
 * @param origin - The wrapper element to extract items from.
 * @param target - The target element to append items to.
 */
function processItems(origin, target) {
    const items = origin.querySelectorAll(".w-dyn-item");
    if (items.length === 0) {
        throw new Error(`The origin doesn't contain any cms-items.`);
    }
    origin.remove();
    items.forEach((item) => {
        item.classList.remove("w-dyn-item");
        target.appendChild(item);
    });
}
/**
 * Extracts the target element from the `data-inlinecms-target` attribute.
 * @param origin - The CMS wrapper with the attribute.
 * @returns The target HTMLElement (or throws an error if not found).
 */
function extractTargetFromAttribute(origin) {
    const targetSelector = origin.getAttribute(INLINECMS_TARGET_ATTR);
    if (!targetSelector) {
        throw new Error(`Origin is missing ${INLINECMS_TARGET_ATTR} attribute.`);
    }
    let target;
    if (targetSelector === "parentNode" ||
        targetSelector === "parent" ||
        targetSelector === "parentElement") {
        target = origin.parentElement;
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
 * Single origin version of inlineCms. For advanced users only.
 * @param options - Specify the origin, target and the doc to perform the operation on.
 */
export function inlineCmsSingle(options) {
    const { origin, target, doc = document } = options;
    const origins = getAllElements(origin, { node: doc });
    origins.forEach((origin, index) => {
        const componentName = origin.getAttribute(INLINECMS_COMPONENT_ATTR) || `index ${index}`;
        validateOrigin(origin);
        // Determine the target element
        const targetElement = target && target !== "parent"
            ? getAllElements(target, { node: doc })[0]
            : origin.parentElement;
        if (!targetElement) {
            throw new Error("Target element not found or specified.");
        }
        try {
            // Process the origin and append items to the target
            processItems(origin, targetElement);
        }
        catch (e) {
            console.warn(`Inlinecms "${componentName}":`, e.message);
        }
    });
}
/**
 * Processes CMS wrappers (origins), extracting their items into their respective target.
 * @param options - Specify the  and the doc to perform the operation on.
 */
export function inlineCms(options) {
    const { origins = "[data-inlinecms-origin]", doc = document } = options;
    const originElements = getAllElements(origins, { node: doc });
    if (originElements.length === 0) {
        throw new Error(`Inlinecms: No wrappers found. ${typeof origins === "string" ? `Selector ${origins}` : ""}`);
    }
    originElements.forEach((origin, index) => {
        const componentName = origin.getAttribute(INLINECMS_COMPONENT_ATTR) || `index ${index}`;
        validateOrigin(origin);
        let targetElement;
        try {
            // Extract the target from the origin's attribute
            targetElement = extractTargetFromAttribute(origin);
        }
        catch (e) {
            console.warn(`Inlinecms "${componentName}":`, e.message, `Setting target to the origin's parent.`);
            targetElement = origin.parentElement;
        }
        try {
            // Process the origin and append items to the target
            processItems(origin, targetElement);
        }
        catch (e) {
            console.warn(`Inlinecms "${componentName}":`, e.message);
        }
    });
}
