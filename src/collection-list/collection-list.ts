import { type Attribute, type Attributes, Dataset } from "../selector/attributes.js";
import type { CollectionListItem } from "./item.js";
import type { PartialDeep } from "type-fest";
import { wf } from "../webflow/webflow.js";
import { Selector, exclude } from "../selector/selector.js";
import { BaseComponent } from "../base-component/index.js";
import { payload } from "../payload/payload.js";

type CollectionListElement = "wrapper" | "list" | "item" | "json" | "empty" | "pagination";

interface CollectionListAttributes extends Attributes {
  id: Attribute;
  element: Attribute<string, CollectionListElement>;
  key: Attribute;
}

interface CollectionListSettings {
  id: string;
  hasNestedList: boolean;

  /**
   * Choose how you want to select the component elements
   * - "peakflow": selects the elements using the component attributes (recommended)
   * - "webflow": selects the elements using the builtin webflow classes
   *
   * NOTE: In "webflow" mode, the json embed still needs to be tagged using `[data-cms-element="json"]`
   */
  selectorMode: "peakflow" | "webflow";
}

export class CollectionList<
  Item extends CollectionListItem = CollectionListItem,
> extends BaseComponent<CollectionListElement> {
  public static defaultOptions: CollectionListSettings = {
    id: null,
    hasNestedList: false,
    selectorMode: "peakflow",
  };

  public dataset = Dataset.define<CollectionListAttributes>({
    id: Dataset.String("data-cms-id"),
    element: Dataset.String("data-cms-element"),
    key: Dataset.String("key"),
  });

  public attr = this.dataset.attr;

  public data: Item[] = [];
  public settings: CollectionListSettings;
  public listElement?: HTMLElement | null;
  public emptyState?: HTMLElement | null;
  private items: HTMLElement[];

  constructor(component: HTMLElement | null, settings: PartialDeep<CollectionListSettings> = {}) {
    super(component, settings);

    if (!component || !component.classList.contains("w-dyn-list")) {
      throw new Error(`Collection list wrapper can't be undefined.`);
    }

    this.initElements();
  }

  private initElements(): void {
    const webflowMode: boolean = this.settings.selectorMode === "webflow";

    const listQuery = webflowMode ? wf.select.cmsList : this.selector("list");
    const itemQuery = webflowMode ? wf.select.cmsItem : this.selector("item");
    const emptyQuery = webflowMode ? wf.select.cmsEmpty : this.selector("empty");
    // TODO: Select pagination elements

    const selector = this.settings.hasNestedList
      ? exclude(itemQuery, `${listQuery} ${listQuery} *`)
      : itemQuery;

    this.listElement = this.component.querySelector(listQuery);
    this.items = Array.from(this.listElement?.querySelectorAll(selector) ?? []);
    this.emptyState = this.component.querySelector(emptyQuery);

    if (this.isEmpty()) {
      console.warn(`CollectionList "${this.settings.id}": Collection is empty.`);
    }
  }

  protected static attributeSelector = Selector.attr<CollectionListElement>(
    CollectionList.attr.element,
  );
  public static selector = Selector.instance<CollectionListElement>(
    this.attributeSelector,
    this.attr,
    { root: "wrapper" },
  );
  public static select = Selector.select<CollectionListElement>(this.selector);
  public static selectAll = Selector.selectAll<CollectionListElement>(this.selector);

  /**
   * @returns True if the collection list has no items, false otherwise.
   */
  public isEmpty(): boolean {
    return !this.listElement && this.component.querySelector(".w-dyn-empty") !== null;
  }

  /**
   * Parses the JSON Data Island of each list item and stores them in `collection.data`.
   *
   * @example HTML structure
   * ```html
   * <div data-cms-element="wrapper" data-cms-id="dokumente">
   *   <div data-cms-element="list">
   *     <div data-cms-element="item" key="{{slug}}">
   *       <script type="application/json" data-cms-element="json" data-cms-id="dokumente">
   *         { // JSON of your choice }
   *       </script>
   *     </div>
   *   </div>
   * </div>
   * ```
   */
  public parse(): Item[] {
    if (this.isEmpty()) {
      this.items = [];
      return;
    }

    const embedSelector = `${this.selector("json")}[${this.attr.id}="${this.id}"]`;
    const exclusion = `${this.selector("wrapper")} ${this.selector("wrapper")} *`;
    const selector = exclude(embedSelector, exclusion);
    const embeds = Array.from(this.component.querySelectorAll<HTMLScriptElement>(selector));

    if (this.settings.hasNestedList) {
      console.warn(
        `CollectionList "${this.id}": parsing nested collection lists is not supported yet. Only parsing top-level items.`,
      );
    }

    for (const embed of embeds) {
      const parsed = payload.parse<Item>(embed);
      this.data.push(parsed);
    }

    return this.data;
  }

  /**
   * Only show items that meet the condition specified in the `predicate` function.
   * @returns The filtered array.
   * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
   * @param options Additional options that define how the filtering is conducted.
   */
  public filter(predicate: FilterFn<Item>, options: Partial<FilterOptions> = {}): Item[] {
    const opts: FilterOptions = {
      removeFromDom: options.removeFromDom ?? false,
    };

    if (opts.removeFromDom) {
      console.warn(
        `CollectionList "${this.settings.id}": The "removeFromDom" option is not supported yet. Hiding elements instead.`,
      );
    }

    if (this.isEmpty()) return;

    const filtered: Item[] = [];

    for (let i = 0; i < this.data.length; i++) {
      const item = this.data[i];
      const element = this.items[i];

      if (predicate(item, i)) {
        element.hidden = false;
        filtered.push(item);
      } else {
        element.hidden = true;
      }
    }

    return filtered;
  }

  /**
   * Sorts the `data` array property of this collection list in place, then renders the new order into the `listElement`.
   *
   * @param compareFn Function used to determine the order of the elements. It is expected to return
   * a negative value if the first argument is less than the second argument, zero if they're equal, and a positive
   * value otherwise. If omitted, the elements are sorted in ascending, UTF-16 code unit order.
   *
   * @example Sort by `item.price` in descending order
   * ```ts
   * collection.sort((a, b) => a.price - b.price)
   * ```
   */
  public sort(compareFn: CompareFn<Item>): Item[] {
    if (this.isEmpty()) return [];

    const elementMap = new Map<Item, HTMLElement>();

    for (let i = 0; i < this.data.length; i++) {
      elementMap.set(this.data[i], this.items[i]);
    }

    this.data.sort(compareFn);

    const sortedFragment = document.createDocumentFragment();

    for (let i = 0; i < this.data.length; i++) {
      this.items[i] = elementMap.get(this.data[i]);
      sortedFragment.appendChild(this.items[i]);
    }

    this.listElement.appendChild(sortedFragment);

    return this.data;
  }
}

export type FilterFn<T extends CollectionListItem> = (item: T, index: number) => boolean;
export type CompareFn<T extends CollectionListItem> = (a: T, b: T) => number;

export interface FilterOptions {
  removeFromDom: boolean;
}
