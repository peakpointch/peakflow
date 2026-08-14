import { type Attribute, type Attributes, Dataset } from "../selector/attributes.js";
import type { CollectionListItem } from "./item.js";
import type { PartialOptions } from "../typeutils/index.js";
import { wf } from "../webflow/webflow.js";
import { Selector, exclude } from "../selector/selector.js";
import { BaseComponent } from "../base-component/index.js";
import { payload, type PayloadVariables } from "../payload/payload.js";

type CollectionListElement = "wrapper" | "list" | "item" | "empty" | "pagination";

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

  public static dataset = Dataset.define<CollectionListAttributes>({
    id: Dataset.String("data-cms-id"),
    element: Dataset.String("data-cms-element"),
    key: Dataset.String("key"),
  });
  public static attr = CollectionList.dataset.attr;

  public dataset = CollectionList.dataset;
  public attr = this.dataset.attr;

  public settings: CollectionListSettings;
  public listElement?: HTMLElement | null;
  public emptyState?: HTMLElement | null;

  /**
   * Array of the parsed `Item`s
   * - The `filter` method never deletes `Item`s from this array.
   * - The `sort` method mutates this array in place.
   */
  public items: Item[] = [];

  /**
   * Array of the live DOM elements
   * - The `filter` method never deletes `HTMLElement`s from this array.
   * - The `sort` method mutates this array in place.
   */
  public elements: HTMLElement[] = [];

  constructor(
    component: HTMLElement | null,
    settings: PartialOptions<CollectionListSettings> = {},
  ) {
    super(component, settings);

    if (!component || !component.classList.contains("w-dyn-list")) {
      throw new Error(`Collection list wrapper can't be undefined.`);
    }

    this.enableLogging();
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
    this.elements = Array.from(this.listElement?.querySelectorAll(selector) ?? []);
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

  private assertItemsMatchElements(): void {
    if (this.items.length !== this.elements.length) {
      throw new Error(
        "Items and elements are out of sync. Use the parse() method before performing this action.",
      );
    }
  }

  /**
   * Iterates over the `CollectionList`'s items, parses their JSON data (using
   * the `payload` module) and stores the parsed `Item`s in `items` property.
   *
   * @returns The array of the parsed `Item`s
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
  public parse(options: Partial<ParseOptions> = {}): Item[] {
    const opts: ParseOptions = {
      variables: options.variables ?? {},
    };

    this.items = [];

    if (this.isEmpty()) {
      return this.items;
    }

    const embedSelector = `${payload.selector("embed")}[${this.attr.id}="${this.id}"]`;
    const exclusion = `${this.selector("wrapper")} ${this.selector("wrapper")} *`;
    const selector = exclude(embedSelector, exclusion);
    const embeds = Array.from(this.component.querySelectorAll<HTMLScriptElement>(selector));

    if (this.settings.hasNestedList) {
      console.warn(
        `CollectionList "${this.id}": parsing nested collection lists is not supported yet. Only parsing top-level items.`,
      );
    }

    for (const embed of embeds) {
      try {
        const parsed = payload.parseRaw<Item>(embed);
        const vars = payload.parseVariables(embed.parentElement);
        payload.hydrate(parsed, {
          ...vars,
          ...opts.variables,
        });
        this.items.push(parsed);
      } catch (e) {
        this.logger.error("Failed to parse item.", e);
      }
    }

    return this.items;
  }

  /**
   * Only show items that meet the condition specified in the `predicate`
   * function.
   *
   * @param predicate A function that accepts up to three arguments. The filter
   *        method calls the predicate function one time for each element in the
   *        array.
   * @param options Additional options that define how the filtering is conducted.
   * @returns The filtered array.
   */
  public filter(
    predicate: FilterFn<Item>,
    options: Partial<FilterOptions> = {},
  ): FilteredResponse<Item> {
    const opts: FilterOptions = {
      removeFromDom: options.removeFromDom ?? false,
    };

    const items: Item[] = [];
    const visibleElements: HTMLElement[] = [];

    if (this.isEmpty()) return { items, visibleElements };

    this.assertItemsMatchElements()

    let lastVisibleElement: HTMLElement | null = null;

    const reinsertElement = (element: HTMLElement): void => {
      if (lastVisibleElement) {
        lastVisibleElement.insertAdjacentElement("afterend", element);
      } else {
        this.listElement.prepend(element);
      }

      lastVisibleElement = element;
    };

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const element = this.elements[i];

      if (predicate(item, i)) {
        if (opts.removeFromDom) {
          reinsertElement(element);
        } else {
          element.hidden = false;
        }
        items.push(item);
        visibleElements.push(element);
      } else {
        if (opts.removeFromDom) {
          element.remove();
        } else {
          element.hidden = true;
        }
      }
    }

    return { items, visibleElements };
  }

  /**
   * Sorts the `data` array property of this collection list in place, then
   * renders the new order into the `listElement`.
   *
   * @param compareFn Function used to determine the order of the elements. It
   *        is expected to return a negative value if the first argument is
   *        less than the second argument, zero if they're equal, and a positive
   *        value otherwise. If omitted, the elements are sorted in ascending,
   *        UTF-16 code unit order.
   *
   * @example Sort by `item.price` in descending order
   * ```ts
   * collection.sort((a, b) => a.price - b.price)
   * ```
   */
  public sort(compareFn: CompareFn<Item>): Item[] {
    if (this.isEmpty()) return [];

    this.assertItemsMatchElements()

    const elementMap = new Map<Item, HTMLElement>();

    for (let i = 0; i < this.items.length; i++) {
      elementMap.set(this.items[i], this.elements[i]);
    }

    this.items.sort(compareFn);

    const sortedFragment = document.createDocumentFragment();

    for (let i = 0; i < this.items.length; i++) {
      this.elements[i] = elementMap.get(this.items[i]);
      sortedFragment.appendChild(this.elements[i]);
    }

    this.listElement.appendChild(sortedFragment);

    return this.items;
  }
}

export type FilterFn<T extends CollectionListItem> = (item: T, index: number) => boolean;
export type CompareFn<T extends CollectionListItem> = (a: T, b: T) => number;

export interface ParseOptions {
  /**
   * Custom variables to be used during the hydration process.
   *
   * @remarks
   * These values take precedence over variables parsed directly from the DOM
   * (i.e. `[data-payload-var]` elements). Use this to programmatically
   * override CMS data or inject global values.
   */
  variables: PayloadVariables;
}

export interface FilterOptions {
  /**
   * Determines whether elements that do not match the filter criteria
   * should be physically removed from the DOM.
   *
   * @defaultValue `false`
   */
  removeFromDom: boolean;
}

export interface FilteredResponse<Item extends CollectionListItem> {
  /**
   * An array of the filtered `Item`s
   */
  items: Item[];
  /**
   * An array of the filtered `HTMLElement`s
   */
  visibleElements: HTMLElement[];
}
