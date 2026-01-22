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
    paginationPrev: `.${wfclass.paginationPrev}`,
    paginationNext: `.${wfclass.paginationNext}`,
    paginationCount: `.${wfclass.paginationCount}`,
    formInput: inputSelectorList.join(", "),
    radioInput: `.${wfclass.wradio} input[type="radio"]`,
    checkboxInput: `.${wfclass.wcheckbox} input[type="checkbox"]:not(.${wfclass.checkbox})`,
    inputSelectorList: inputSelectorList,
};
export const wf = {
    siteId,
    pageId,
    class: wfclass,
    select: wfselect,
    isVisible: (el) => {
        return !(el.classList.contains(wfclass.invisible) || el.closest(wfselect.invisible));
    },
    hasAttr: (element, attribute) => {
        return element.hasAttribute(attribute) && element.getAttribute(attribute) !== "false";
    },
    hasTrueAttr: (element, attribute) => {
        return element.hasAttribute(attribute) && element.getAttribute(attribute) === "true";
    },
};
