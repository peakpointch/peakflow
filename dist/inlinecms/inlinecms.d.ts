/**
 * General-purpose function to inline CMS items into a target element.
 * @param container - CSS selector or HTMLElement(s) for the container(s).
 * @param target - CSS selector or HTMLElement for the target. If omitted, parent of the container is used.
 */
export declare function inlineCmsDev(container: string | HTMLElement, target?: string | HTMLElement): void;
/**
 * Processes a NodeList of CMS containers or a CSS selector that matches multiple CMS containers,
 * extracting items into their respective targets.
 * Each container must have a `data-inlinecms-target` attribute.
 * @param containers - A NodeListOf<HTMLElement> or a CSS selector string for CMS container elements.
 */
export declare function inlineCms(containers: string | NodeListOf<HTMLElement>): void;
