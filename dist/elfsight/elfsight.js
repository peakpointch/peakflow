import { getAllElements } from "../utils";
/**
 * Attaches a load listener to one or multiple widget containers.
 */
export async function onWidgetLoad(container, callback, options) {
    const containers = getAllElements(container);
    const promises = containers.map((el) => onElfsightLoad(el, callback, options));
    return Promise.all(promises);
}
export async function onElfsightLoad(container, callback, options) {
    const opts = {
        minWidth: 0,
        minHeight: 0,
        conditions: () => true,
        ...options,
    };
    return new Promise((resolve) => {
        const isFullyRendered = () => {
            // Has to have 'eapps-' widget root element
            const widget = container.querySelector('[class*="eapps-"]');
            if (!widget)
                return false;
            const rect = widget.getBoundingClientRect();
            // Must have dimensions
            const hasDimensions = rect.width > opts.minWidth && rect.height > opts.minHeight;
            return hasDimensions && opts.conditions(container);
        };
        // If already rendered, fire immediately
        if (isFullyRendered()) {
            return resolve(callback());
        }
        const observer = new MutationObserver((_, obs) => {
            if (isFullyRendered()) {
                obs.disconnect();
                if (opts.delay !== undefined && opts.delay !== null) {
                    setTimeout(() => resolve(callback()), opts.delay);
                }
                else {
                    return resolve(callback());
                }
            }
        });
        observer.observe(container, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class"],
        });
    });
}
