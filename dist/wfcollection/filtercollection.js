import { CollectionList } from 'src/wfcollection';
export class FilterCollection extends CollectionList {
    constructor(container, name = '', rendererName = 'wf') {
        super(container, name, rendererName);
        this.renderer.addFilterAttributes({
            "date": "date",
            "end-date": "date",
        });
    }
    filterByDate(startDate, endDate, ...additionalConditions) {
        const filtered = [...this.collectionData].filter((entry) => {
            // Base conditions
            const baseCondition = entry.date.getTime() >= startDate.getTime() &&
                entry.date.getTime() <= endDate.getTime();
            // Check all additional conditions
            const allAdditionalConditions = additionalConditions.every((condition) => condition(entry));
            return baseCondition && allAdditionalConditions;
        });
        this.log('Filtered Data:', filtered);
        return filtered;
    }
    filterByDateRange(startDate, endDate, ...additionalConditions) {
        if (startDate.getTime() > endDate.getTime()) {
            throw new RangeError(`Invalid date range: startDate (${startDate}) is after endDate (${endDate})`);
        }
        let filtered = [...this.collectionData].filter((entry) => {
            const startDateInRange = entry.startDate.getTime() >= startDate.getTime() &&
                entry.startDate.getTime() <= endDate.getTime();
            const endDateInRange = entry.endDate.getTime() >= startDate.getTime() &&
                entry.endDate.getTime() <= endDate.getTime();
            const startOrEndInRange = startDateInRange || endDateInRange;
            const startBeforeEndAfter = entry.startDate.getTime() <= startDate.getTime() &&
                entry.endDate.getTime() >= endDate.getTime();
            // Check all additional conditions
            const allAdditionalConditions = additionalConditions.every((condition) => condition(entry));
            return (startOrEndInRange || startBeforeEndAfter) && allAdditionalConditions;
        });
        this.log('Filtered Data:', filtered);
        return filtered;
    }
}
