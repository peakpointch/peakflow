import type { WebflowClassNames, WebflowEnv, WebflowSelectors, WfPageId, WfSiteId } from "../../types/webflow.js";
export declare const wfclass: WebflowClassNames;
export declare const wfselect: WebflowSelectors;
export declare class Webflow {
    private static instance;
    siteId: WfSiteId;
    pageId: WfPageId;
    class: WebflowClassNames;
    select: WebflowSelectors;
    private constructor();
    static getInstance(): Webflow;
    initGlobal(): void;
    /**
     * Determines whether a given element is visible accordion to Webflow's
     * conditional visibility rules.
     */
    isVisible(el: Element): boolean;
    /**
     * Returns true if an attribute is present and not explicitly "false".
     * Works like a boolean HTML attribute.
     */
    hasAttr(element: Element, attribute: string): boolean;
    /**
     * Returns true if an attribute is present and explicitly "true".
     */
    hasTrueAttr(element: Element, attribute: string): boolean;
    /**
     * Current Webflow environment
     */
    get env(): WebflowEnv;
    /**
     * The designer iframe document if env is "designer", standard `document` otherwise
     */
    get doc(): Document;
}
export declare const wf: Webflow;
