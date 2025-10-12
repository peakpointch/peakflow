import { FormArrayItem } from "./item";
import { type FormArrayOptions } from "./array";
import { type Pluralized } from "../../pluralize";

export type MessageFn<Item extends FormArrayItem> = (ctx: {
  item?: Item;
  grammar: GrammarOptions;
  options: FormArrayOptions<Item>;
}) => string;

export type FormArrayMessageName = "empty" | "draft" | "invalid" | "limit";
export type FormArrayDialogName = "delete" | "discard";

export type FormMessages<Item extends FormArrayItem> = {
  [K in FormArrayMessageName]?: string | MessageFn<Item>;
};

export type FormArrayDialogs<Item extends FormArrayItem> = {
  [K in FormArrayDialogName]?: FormArrayDialogMessage<Item>;
};

export interface GrammarOptions {
  item: Pluralized;
  article: Pluralized;
}

interface FormArrayDialogMessage<Item extends FormArrayItem> {
  title: string | MessageFn<Item>;
  paragraph: string | MessageFn<Item>;
  cancel: string;
  confirm: string;
}
