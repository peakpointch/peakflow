import findElements from "./findelements";
const INLINECMS_TARGET_ATTR = `data-inlinecms-target`;
const INLINECMS_COMPONENT_ATTR = `data-inlinecms-component`;
function validateContainer(container) {
  if (!container.classList.contains("w-dyn-list")) {
    throw new Error("The element given is not a CMS list: " + container);
  }
}
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
function extractTargetFromAttribute(container) {
  const targetSelector = container.getAttribute(INLINECMS_TARGET_ATTR);
  if (!targetSelector) {
    throw new Error(`Container is missing ${INLINECMS_TARGET_ATTR} attribute.`);
  }
  let target;
  if (targetSelector === "parentNode" || targetSelector === "parent" || targetSelector === "parentElement") {
    target = container.parentElement;
  } else {
    target = document.querySelector(targetSelector);
  }
  if (!target) {
    throw new Error(`Target element not found with specified selector: "${targetSelector}".`);
  }
  return target;
}
function inlineCmsDev(container, target) {
  const containers = findElements(container, true);
  containers.forEach((container2, index) => {
    const componentName = container2.getAttribute(INLINECMS_COMPONENT_ATTR) || `index ${index}`;
    validateContainer(container2);
    const targetElement = target ? findElements(target)[0] : container2.parentElement;
    if (!targetElement) {
      throw new Error("Target element not found or specified.");
    }
    try {
      processItems(container2, targetElement);
    } catch (e) {
      console.warn(`Inlinecms "${componentName}":`, e.message);
    }
  });
}
function inlineCms(containers) {
  let containerElements;
  if (typeof containers === "string") {
    containerElements = findElements(containers, true);
  } else {
    containerElements = Array.from(containers);
  }
  if (containerElements.length === 0) {
    throw new Error(`No containers found matching: ${typeof containers === "string" ? containers : ""} `);
  }
  containerElements.forEach((container, index) => {
    const componentName = container.getAttribute(INLINECMS_COMPONENT_ATTR) || `index ${index}`;
    validateContainer(container);
    let targetElement;
    try {
      targetElement = extractTargetFromAttribute(container);
    } catch (e) {
      console.warn(`Inlinecms "${componentName}":`, e.message, `Setting target to the containers parent.`);
      targetElement = container.parentElement;
    }
    try {
      processItems(container, targetElement);
    } catch (e) {
      console.warn(`Inlinecms "${componentName}":`, e.message);
    }
  });
}
export {
  inlineCms,
  inlineCmsDev
};
