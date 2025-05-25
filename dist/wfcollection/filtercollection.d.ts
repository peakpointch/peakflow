import { CollectionList, CollectionListOptions } from './wfcollection';
import { FilterAttributes, RenderData, RenderElement, RenderField } from '../renderer';
type MenuDataCondition = ((menuData: RenderElement | RenderField) => boolean);
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
