import { CollectionList } from 'src/wfcollection';
import { RenderData, RenderElement, RenderField } from 'src/renderer';
type MenuDataCondition = ((menuData: RenderElement | RenderField) => boolean);
export declare class FilterCollection extends CollectionList {
    constructor(container: HTMLElement | null, name?: string, rendererName?: string);
    filterByDate(startDate: Date, endDate: Date, ...additionalConditions: MenuDataCondition[]): RenderData;
    filterByDateRange(startDate: Date, endDate: Date, ...additionalConditions: MenuDataCondition[]): RenderData;
}
export {};
