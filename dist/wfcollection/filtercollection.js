import { WfCollection } from "./wfcollection.js";
import Renderer from "../renderer/index.js";
export class FilterCollection extends WfCollection {
    constructor(container, options) {
        const filterAttributes = options.rendererOptions?.filterAttributes ?? {};
        const mergedFilterAttributes = Renderer.defineAttributes({
            ...FilterCollection.defaultAttributes,
            ...filterAttributes,
        });
        const newOptions = {
            ...options,
            rendererOptions: {
                ...options.rendererOptions,
                filterAttributes: mergedFilterAttributes,
            },
        };
        super(container, newOptions);
    }
    filterByDate(startDate, endDate, ...additionalConditions) {
        const filtered = [...this.collectionData].filter((entry) => {
            // Base conditions
            const baseCondition = entry.props.date.getTime() >= startDate.getTime() &&
                entry.props.date.getTime() <= endDate.getTime();
            // Check all additional conditions
            const allAdditionalConditions = additionalConditions.every((condition) => condition(entry));
            return baseCondition && allAdditionalConditions;
        });
        this.log("Filtered Data:", filtered);
        return filtered;
    }
    filterByDateRange(startDate, endDate, ...additionalConditions) {
        if (startDate.getTime() > endDate.getTime()) {
            throw new RangeError(`Invalid date range: startDate (${startDate}) is after endDate (${endDate})`);
        }
        let filtered = [...this.collectionData].filter((entry) => {
            const startDateInRange = entry.props.startDate.getTime() >= startDate.getTime() &&
                entry.props.startDate.getTime() <= endDate.getTime();
            const endDateInRange = entry.props.endDate.getTime() >= startDate.getTime() &&
                entry.props.endDate.getTime() <= endDate.getTime();
            const startOrEndInRange = startDateInRange || endDateInRange;
            const startBeforeEndAfter = entry.props.startDate.getTime() <= startDate.getTime() &&
                entry.props.endDate.getTime() >= endDate.getTime();
            // Check all additional conditions
            const allAdditionalConditions = additionalConditions.every((condition) => condition(entry));
            return (startOrEndInRange || startBeforeEndAfter) && allAdditionalConditions;
        });
        this.log("Filtered Data:", filtered);
        return filtered;
    }
}
FilterCollection.defaultAttributes = Renderer.defineAttributes({
    date: "date",
    "start-date": "date",
    "end-date": "date",
});
