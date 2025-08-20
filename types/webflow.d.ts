export interface WebflowClassNames {
  invisible: "w-condition-invisible";
  input: "w-input";
  select: "w-select";
  wradio: "w-radio";
  radio: "w-radio-input";
  wcheckbox: "w-checkbox";
  checkbox: "w-checkbox-input";
  checked: "w--redirected-checked";
  focus: "w--redirected-focus";
  focusVisible: "w--redirected-focus-visible";
  cmsWrapper: "w-dyn-list";
  cmsList: "w-dyn-items";
  cmsItem: "w-dyn-item";
}

type InputSelectorList = Array<
  | `.${WebflowClassNames["input"]}`
  | `.${WebflowClassNames["select"]}`
  | `.${WebflowClassNames["wradio"]} input[type="radio"]`
  | `.${WebflowClassNames["wcheckbox"]} input[type="checkbox"]:not(.${WebflowClassNames["checkbox"]})`
>;

export interface WebflowSelectors {
  invisible: `.${WebflowClassNames["invisible"]}`;
  input: `.${WebflowClassNames["input"]}`;
  select: `.${WebflowClassNames["select"]}`;
  wradio: `.${WebflowClassNames["wradio"]}`;
  radio: `.${WebflowClassNames["radio"]}`;
  wcheckbox: `.${WebflowClassNames["wcheckbox"]}`;
  checkbox: `.${WebflowClassNames["checkbox"]}`;
  checked: `.${WebflowClassNames["checked"]}`;
  focused: `:focus-visible, [data-wf-focus-visible]`;
  focus: `.${WebflowClassNames["focus"]}`;
  focusVisible: `.${WebflowClassNames["focusVisible"]}`;
  cmsWrapper: `.${WebflowClassNames["cmsWrapper"]}`;
  cmsList: `.${WebflowClassNames["cmsList"]}`;
  cmsItem: `.${WebflowClassNames["cmsItem"]}`;

  /** CSS Selector to select all `HTMLFormInput`'s. */
  formInput: string;
  radioInput: `.${WebflowClassNames["wradio"]} input[type="radio"]`;
  checkboxInput: `.${WebflowClassNames["wcheckbox"]} input[type="checkbox"]:not(.${WebflowClassNames["checkbox"]})`;
  inputSelectorList: InputSelectorList;
}

export type WfSiteId = string;
export type WfPageId = string;
export type WfElementId = string;

export interface Webflow {
  siteId: WfSiteId;
  pageId: WfPageId;
  class: WebflowClassNames;
  select: WebflowSelectors;
}

export interface WfFormData {
  /** Name of the form. Inferred from `HTMLFormElement.dataset.name` */
  name: string;
  pageId: WfPageId;
  elementId: WfElementId;
  /** Source URL the form is submitted from */
  source: string;
  /** Form data - The submitted fields from the form */
  fields: any;
  test: boolean;
  dolphin: boolean;
}
