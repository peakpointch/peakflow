import { CollectionList } from '@library/wfcollection';
import { RenderData, RenderElement, RenderField } from '@library/renderer';
type MenuDataCondition = ((menuData: RenderElement | RenderField) => boolean);
export declare class FilterCollection extends CollectionList {
    constructor(container: HTMLElement | null, name?: string, rendererName?: string);
    filterByDate(startDate: Date, endDate: Date, ...additionalConditions: MenuDataCondition[]): RenderData;
    filterByDateRange(startDate: Date, endDate: Date, ...additionalConditions: MenuDataCondition[]): RenderData;
}
export {};
