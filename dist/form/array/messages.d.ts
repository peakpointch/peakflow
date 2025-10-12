import { FormArrayItem } from "./item";
import { type FormArrayOptions } from "./array";
import { type Pluralized } from "../../pluralize";
export type FormArrayMessageName = "empty" | "draft" | "invalid" | "limit";
type MessageFn<Item extends FormArrayItem> = (ctx: {
    item?: Item;
    grammar: GrammarOptions;
    options: FormArrayOptions<Item>;
}) => string;
export type FormMessages<Item extends FormArrayItem> = {
    [K in FormArrayMessageName]?: string | MessageFn<Item>;
};
export interface GrammarOptions {
    item: Pluralized;
    article: Pluralized;
}
export {};
