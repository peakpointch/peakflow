import { CollectionList } from './wfcollection';
import Renderer from '../renderer';
import { FilterAttributes, RenderData, RenderElement, RenderField } from '../renderer';

type MenuDataCondition = ((menuData: RenderElement | RenderField) => boolean);

type Merged<F extends FilterAttributes<keyof F & string>> = FilterAttributes<keyof F & string | keyof typeof FilterCollection.defaultAttributes & string>;

export class FilterCollection<
  F extends FilterAttributes<keyof F & string> = {}
> extends CollectionList<Merged<F>> {

  static defaultAttributes = Renderer.defineAttributes({
    "date": "date",
    "start-date": "date",
    "end-date": "date"
  });

  constructor(
    container: HTMLElement | null,
    filterAttributes: F,
    name: string = '',
    rendererName: string = 'wf'
  ) {

    const merged = {
      ...FilterCollection.defaultAttributes,
      ...filterAttributes,
    } as Merged<F>;

    super(container, merged, name, rendererName);
  }

  public filterByDate(
    startDate: Date,
    endDate: Date,
    ...additionalConditions: MenuDataCondition[]
  ): RenderData<F> {
    const filtered = [...this.collectionData].filter(
      (entry) => {
        // Base conditions
        const baseCondition =
          entry.date.getTime() >= startDate.getTime() &&
          entry.date.getTime() <= endDate.getTime();

        // Check all additional conditions
        const allAdditionalConditions = additionalConditions.every((condition) => condition(entry));

        return baseCondition && allAdditionalConditions;
      }
    );

    this.log('Filtered Data:', filtered);

    return filtered;
  }

  public filterByDateRange(
    startDate: Date,
    endDate: Date,
    ...additionalConditions: MenuDataCondition[]
  ): RenderData {
    if (startDate.getTime() > endDate.getTime()) {
      throw new RangeError(`Invalid date range: startDate (${startDate}) is after endDate (${endDate})`);
    }

    let filtered = [...this.collectionData].filter((entry) => {
      const startDateInRange =
        entry.startDate.getTime() >= startDate.getTime() &&
        entry.startDate.getTime() <= endDate.getTime();

      const endDateInRange =
        entry.endDate.getTime() >= startDate.getTime() &&
        entry.endDate.getTime() <= endDate.getTime();

      const startOrEndInRange = startDateInRange || endDateInRange;

      const startBeforeEndAfter =
        entry.startDate.getTime() <= startDate.getTime() &&
        entry.endDate.getTime() >= endDate.getTime();

      // Check all additional conditions
      const allAdditionalConditions = additionalConditions.every((condition) => condition(entry));

      return (startOrEndInRange || startBeforeEndAfter) && allAdditionalConditions;
    });

    this.log('Filtered Data:', filtered);

    return filtered;
  }
}
