import { CollectionList } from "./wfcollection.js";
import type { CollectionListOptions } from "./wfcollection.js";
import type { FilterAttributes, RenderData, RenderBlock, RenderField } from "../renderer/index.js";
type MenuDataCondition = (menuData: RenderBlock | RenderField) => boolean;
type Merged<F extends FilterAttributes<keyof F & string>> = F & typeof FilterCollection.defaultAttributes;
export declare class FilterCollection<F extends FilterAttributes<keyof F & string> = {}> extends CollectionList<Merged<F>> {
    options: CollectionListOptions<Merged<F>>;
    static defaultAttributes: {
        date: "date";
        "start-date": "date";
        "end-date": "date";
    };
    constructor(container: HTMLElement | null, options?: CollectionListOptions<Merged<F>>);
    filterByDate(startDate: Date, endDate: Date, ...additionalConditions: MenuDataCondition[]): RenderData<Merged<F>>;
    filterByDateRange(startDate: Date, endDate: Date, ...additionalConditions: MenuDataCondition[]): RenderData<Merged<F>>;
}
export {};
