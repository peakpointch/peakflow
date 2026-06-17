// Webflow environment
const siteId = document.documentElement.dataset.wfSite || "";
const pageId = document.documentElement.dataset.wfPage || "";
// Constants
export const wfclass = {
    invisible: "w-condition-invisible",
    input: "w-input",
    select: "w-select",
    wradio: "w-radio",
    radio: "w-radio-input",
    wcheckbox: "w-checkbox",
    checkbox: "w-checkbox-input",
    checked: "w--redirected-checked",
    focus: "w--redirected-focus",
    focusVisible: "w--redirected-focus-visible",
    cmsWrapper: "w-dyn-list",
    cmsList: "w-dyn-items",
    cmsItem: "w-dyn-item",
    cmsEmpty: "w-dyn-empty",
    cmsBindEmpty: "w-dyn-bind-empty",
    paginationPrev: "w-pagination-previous",
    paginationNext: "w-pagination-next",
    paginationCount: "w-page-count",
};
const inputSelectorList = [
    `.${wfclass.input}`,
    `.${wfclass.select}`,
    `.${wfclass.wradio} input[type="radio"]`,
    `.${wfclass.wcheckbox} input[type="checkbox"]:not(.${wfclass.checkbox})`,
];
export const wfselect = {
    invisible: `.${wfclass.invisible}`,
    input: `.${wfclass.input}`,
    select: `.${wfclass.select}`,
    wradio: `.${wfclass.wradio}`,
    radio: `.${wfclass.radio}`,
    wcheckbox: `.${wfclass.wcheckbox}`,
    checkbox: `.${wfclass.checkbox}`,
    checked: `.${wfclass.checked}`,
    focused: `:focus-visible, [data-wf-focus-visible]`,
    focus: `.${wfclass.focus}`,
    focusVisible: `.${wfclass.focusVisible}`,
    cmsWrapper: `.${wfclass.cmsWrapper}`,
    cmsList: `.${wfclass.cmsList}`,
    cmsItem: `.${wfclass.cmsItem}`,
    cmsEmpty: `.${wfclass.cmsEmpty}`,
    cmsBindEmpty: `.${wfclass.cmsBindEmpty}`,
    paginationPrev: `.${wfclass.paginationPrev}`,
    paginationNext: `.${wfclass.paginationNext}`,
    paginationCount: `.${wfclass.paginationCount}`,
    formInput: inputSelectorList.join(", "),
    radioInput: `.${wfclass.wradio} input[type="radio"]`,
    checkboxInput: `.${wfclass.wcheckbox} input[type="checkbox"]:not(.${wfclass.checkbox})`,
    inputSelectorList: inputSelectorList,
};
export class Webflow {
    constructor() {
        this.siteId = siteId;
        this.pageId = pageId;
        this.class = wfclass;
        this.select = wfselect;
    }
    static getInstance() {
        if (!Webflow.instance) {
            Webflow.instance = new Webflow();
            window.peakflow = window.peakflow || {};
            window.peakflow.webflow = Webflow.instance;
        }
        return Webflow.instance;
    }
    initGlobal() { }
    /**
     * Determines whether a given element is visible accordion to Webflow's
     * conditional visibility rules.
     */
    isVisible(el) {
        return !(el.classList.contains(wfclass.invisible) ||
            el.classList.contains(wfclass.cmsBindEmpty) ||
            el.closest(wfselect.invisible) ||
            el.closest(wfselect.cmsBindEmpty));
    }
    /**
     * Returns true if an attribute is present and not explicitly "false".
     * Works like a boolean HTML attribute.
     */
    hasAttr(element, attribute) {
        return element.hasAttribute(attribute) && element.getAttribute(attribute) !== "false";
    }
    /**
     * Returns true if an attribute is present and explicitly "true".
     */
    hasTrueAttr(element, attribute) {
        return element.hasAttribute(attribute) && element.getAttribute(attribute) === "true";
    }
    /**
     * Current Webflow environment
     */
    get env() {
        const host = window.location.hostname;
        if (host === "localhost") {
            return "development";
        }
        else if (host.includes(".design.webflow.com")) {
            return "designer";
        }
        else if (host.includes(".webflow.io")) {
            return "staging";
        }
        else {
            return "production";
        }
    }
    /**
     * The designer iframe document if env is "designer", standard `document` otherwise
     */
    get doc() {
        if (this.env === "designer") {
            const iframe = document.querySelector("#site-iframe-next");
            return iframe ? iframe.contentDocument || iframe.contentWindow.document : null;
        }
        else {
            return document;
        }
    }
}
export const wf = Webflow.getInstance();
