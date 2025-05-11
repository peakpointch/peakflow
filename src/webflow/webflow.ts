import type {
  InputSelectorList,
  Webflow,
  WebflowClassNames,
  WebflowSelectors,
} from "~/types/webflow";

// Webflow environment
const siteId: string = document.documentElement.dataset.wfSite || "";
const pageId: string = document.documentElement.dataset.wfPage || "";

// Constants
export const wfclass: WebflowClassNames = {
  invisible: "w-condition-invisible",
  input: "w-input",
  select: "w-select",
  wradio: "w-radio",
  radio: "w-radio-input",
  wcheckbox: "w-checkbox",
  checkbox: "w-checkbox-input",
  checked: "w--redirected-checked",
};

const inputSelectorList: InputSelectorList = [
  `.${wfclass.input}`,
  `.${wfclass.select}`,
  `.${wfclass.wradio} input[type="radio"]`,
  `.${wfclass.wcheckbox} input[type="checkbox"]:not(.${wfclass.checkbox})`,
];

export const wfselect: WebflowSelectors = {
  invisible: `.${wfclass.invisible}`,
  input: `.${wfclass.input}`,
  select: `.${wfclass.select}`,
  wradio: `.${wfclass.wradio}`,
  radio: `.${wfclass.radio}`,
  wcheckbox: `.${wfclass.wcheckbox}`,
  checkbox: `.${wfclass.checkbox}`,
  checked: `.${wfclass.checked}`,
  formInput: inputSelectorList.join(", "),
  radioInput: `.${wfclass.wradio} input[type="radio"]`,
  checkboxInput: `.${wfclass.wcheckbox} input[type="checkbox"]:not(.${wfclass.checkbox})`,
  inputSelectorList: inputSelectorList,
};

export const wf: Webflow = {
  siteId,
  pageId,
  class: wfclass,
  select: wfselect,
};
