import { CollectionList } from "./wfcollection";
import Renderer from "../renderer";
const _FilterCollection = class _FilterCollection extends CollectionList {
  constructor(container, filterAttributes, name = "", rendererName = "wf") {
    const merged = {
      ..._FilterCollection.defaultAttributes,
      ...filterAttributes
    };
    super(container, merged, name, rendererName);
  }
  filterByDate(startDate, endDate, ...additionalConditions) {
    const filtered = [...this.collectionData].filter(
      (entry) => {
        const baseCondition = entry.date.getTime() >= startDate.getTime() && entry.date.getTime() <= endDate.getTime();
        const allAdditionalConditions = additionalConditions.every((condition) => condition(entry));
        return baseCondition && allAdditionalConditions;
      }
    );
    this.log("Filtered Data:", filtered);
    return filtered;
  }
  filterByDateRange(startDate, endDate, ...additionalConditions) {
    if (startDate.getTime() > endDate.getTime()) {
      throw new RangeError(`Invalid date range: startDate (${startDate}) is after endDate (${endDate})`);
    }
    let filtered = [...this.collectionData].filter((entry) => {
      const startDateInRange = entry.startDate.getTime() >= startDate.getTime() && entry.startDate.getTime() <= endDate.getTime();
      const endDateInRange = entry.endDate.getTime() >= startDate.getTime() && entry.endDate.getTime() <= endDate.getTime();
      const startOrEndInRange = startDateInRange || endDateInRange;
      const startBeforeEndAfter = entry.startDate.getTime() <= startDate.getTime() && entry.endDate.getTime() >= endDate.getTime();
      const allAdditionalConditions = additionalConditions.every((condition) => condition(entry));
      return (startOrEndInRange || startBeforeEndAfter) && allAdditionalConditions;
    });
    this.log("Filtered Data:", filtered);
    return filtered;
  }
};
_FilterCollection.defaultAttributes = Renderer.defineAttributes({
  "date": "date",
  "start-date": "date",
  "end-date": "date"
});
let FilterCollection = _FilterCollection;
export {
  FilterCollection
};
