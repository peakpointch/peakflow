import { type Attribute, type Attributes, Dataset } from "../selector/attributes.js";
import type { CollectionListItem } from "./item.js";
import type { PartialOptions } from "../typeutils/index.js";
import { wf } from "../webflow/webflow.js";
import { Selector } from "../selector/selector.js";
import { BaseComponent } from "../base-component/index.js";
import { Payload } from "../payload/payload.js";
import type {
  PayloadVariables,
  PayloadVariableResolver,
  PayloadVariableResolvers,
} from "../payload/types.js";
import { PayloadValueError } from "../payload/schema.js";

export type CollectionListElement = "wrapper" | "list" | "item" | "empty" | "pagination";

interface CollectionListAttributes extends Attributes {
  id: Attribute;
  element: Attribute<string, CollectionListElement>;
  key: Attribute;
}

/**
 * Defines the item parser accepted by `CollectionList`.
 *
 * `PayloadSchema` implements this contract, but consumers may provide any parser
 * with a compatible `parseData()` method.
 */
export interface CollectionListPayloadSchema<Item extends CollectionListItem> {
  parseData(value: unknown): Item;
}

export interface NestedCollectionListSettings {
  /**
   * Describes collection lists nested directly inside this list.
   *
   * This configuration only describes how to find nested list wrappers. Their
   * values are validated by nested definitions in the root list's payload schema.
   */
  nestedLists?: NestedCollectionLists;
}

export type NestedCollectionLists = Record<string, NestedCollectionListSettings>;

export interface CollectionListSettings<Item extends CollectionListItem> {
  id: string;

  /**
   * Validates each item after its variables and nested collections are resolved.
   *
   * `parse()` requires a schema, but DOM-only operations do not. Nested lists are
   * inserted through `{{cms:...}}` references before this schema runs, so their
   * validation belongs in nested definitions within the outermost list's schema.
   */
  schema?: CollectionListPayloadSchema<Item>;

  /**
   * Describes the nested collection-list wrappers available to `{{cms:...}}`
   * references.
   *
   * Each key must match the nested wrapper's `data-cms-id`. Only configured lists
   * are discovered and materialized.
   *
   * @defaultValue `{}`
   */
  nestedLists: NestedCollectionLists;
}

type MaterializedItem = Record<string, unknown>;
type MaterializedCollections = Record<string, MaterializedItem[]>;

/**
 * Manages parsed data and live DOM elements for a Webflow Collection List.
 *
 * - `parse()` parses structured JSON payloads into `Item`s
 * - `filter()` returns matching items and updates their live DOM elements
 * - `sort()` sorts the parsed items and their live DOM elements
 * - Uses the library's familiar static and instance selector pattern inherited
 *   from `BaseComponent`
 *
 * @example
 * ```typescript
 * import { CollectionList } from "peakflow/collection-list";
 * import { Payload } from "peakflow/payload";
 *
 * const productSchema = Payload.define(
 *   {
 *     slug: Payload.String(),
 *     name: Payload.String(),
 *     price: Payload.Number(),
 *   },
 *   { primitivesFromString: true },
 * );
 *
 * type Product = Payload.Parsed<typeof productSchema>;
 *
 * const products = new CollectionList<Product>(
 *   CollectionList.select("wrapper", "products"),
 *   {
 *     id: "products",
 *     schema: productSchema,
 *   },
 * );
 *
 * products.parse();
 * products.filter((product) => product.price > 100);
 * products.sort((a, b) => a.price - b.price);
 * ```
 *
 * @example
 * ```html
 * <div class="w-dyn-list" data-cms-element="wrapper" data-cms-id="products">
 *   <div class="w-dyn-items" data-cms-element="list">
 *     <div class="w-dyn-item" data-cms-element="item">
 *       <script
 *         type="application/json"
 *         data-payload-element="embed"
 *         data-cms-id="products"
 *       >
 *         {
 *           "slug": "desk-lamp",
 *           "name": "Desk lamp",
 *           "price": "129"
 *         }
 *       </script>
 *     </div>
 *   </div>
 * </div>
 * ```
 */
export class CollectionList<
  Item extends CollectionListItem = CollectionListItem,
> extends BaseComponent<CollectionListElement> {
  public static defaultSettings: CollectionListSettings<CollectionListItem> = {
    id: null,
    nestedLists: {},
  };

  public static dataset = Dataset.define<CollectionListAttributes>({
    id: Dataset.String("data-cms-id"),
    element: Dataset.String("data-cms-element"),
    key: Dataset.String("key"),
  });
  public static attr = CollectionList.dataset.attr;

  public dataset = CollectionList.dataset;
  public attr = this.dataset.attr;

  public settings: CollectionListSettings<Item>;
  public listElement?: HTMLElement | null;
  public emptyState?: HTMLElement | null;

  /**
   * Stores parsed items in the same order as `elements` after a successful
   * `parse()`.
   *
   * Filtering leaves this array unchanged. Sorting mutates both arrays to preserve
   * their positional relationship.
   */
  public items: Item[] = [];

  /**
   * Stores live item elements in the same order as `items`.
   *
   * Filtering may hide or detach elements but never removes them from this array.
   */
  public elements: HTMLElement[] = [];

  constructor(
    component: HTMLElement | null,
    settings: PartialOptions<CollectionListSettings<Item>> = {},
  ) {
    super(component, settings);

    this.assertComponent();
    this.enableLogging();
    this.initElements();
  }

  /**
   * Validates the collection root's required Peakflow tags.
   *
   * Collection lists follow the same attribute-based selector contract as other
   * `BaseComponent` implementations. The resolved collection ID must match the
   * root's `data-cms-id` so selectors, payload embeds, and nested configuration
   * cannot refer to different collection instances.
   */
  private assertComponent(): void {
    const wrapperSelector = this.selector("wrapper");
    const attributeId = this.component.getAttribute(this.attr.id);

    if (!this.component.matches(wrapperSelector)) {
      throw new Error(`CollectionList must match the required root tag ${wrapperSelector}.`);
    }

    if (!attributeId) {
      throw new Error(`CollectionList must define the required "${this.attr.id}" attribute.`);
    }

    if (this.id !== attributeId) {
      throw new Error(
        `CollectionList id "${this.id}" must match the root's "${this.attr.id}" value "${attributeId}".`,
      );
    }
  }

  private initElements(): void {
    const listQuery = this.selector("list");
    const itemQuery = this.selector("item");
    const emptyQuery = this.selector("empty");
    const wrapperOwnershipSelector = this.selector("wrapper");
    // TODO: Select pagination elements

    this.assertWebflowElementTags();

    const listElements = Array.from(this.component.querySelectorAll<HTMLElement>(listQuery)).filter(
      (element) => element.closest(wrapperOwnershipSelector) === this.component,
    );

    const emptyStates = Array.from(this.component.querySelectorAll<HTMLElement>(emptyQuery)).filter(
      (element) => element.closest(wrapperOwnershipSelector) === this.component,
    );

    this.listElement = listElements[0] ?? null;
    this.emptyState = emptyStates[0] ?? null;
    this.elements = Array.from(
      this.listElement?.querySelectorAll<HTMLElement>(itemQuery) ?? [],
    ).filter((element) => element.closest(wrapperOwnershipSelector) === this.component);

    this.assertElementStructure(listElements, emptyStates);

    if (this.isEmpty()) {
      console.warn(`CollectionList "${this.id}": Collection is empty.`);
    }
  }

  /**
   * Validates Peakflow tags on direct Webflow collection elements.
   *
   * Partially tagged Webflow DOM would otherwise exclude only the missing roles
   * and leave the collection in a misleading state. Attribute-only DOM remains
   * supported because this check only applies to elements carrying Webflow's
   * generated collection classes.
   */
  private assertWebflowElementTags(): void {
    const roles: Array<[Exclude<CollectionListElement, "wrapper" | "pagination">, string]> = [
      ["list", wf.select.cmsList],
      ["item", wf.select.cmsItem],
      ["empty", wf.select.cmsEmpty],
    ];

    for (const [role, webflowSelector] of roles) {
      const peakflowSelector = this.selector(role);
      const untaggedElements = Array.from(
        this.component.querySelectorAll<HTMLElement>(webflowSelector),
      ).filter(
        (element) =>
          element.closest(wf.select.cmsWrapper) === this.component &&
          !element.matches(peakflowSelector),
      );

      if (untaggedElements.length > 0) {
        throw new Error(
          `CollectionList "${this.id}" found ${untaggedElements.length} direct Webflow ${role} element${untaggedElements.length === 1 ? "" : "s"} without the required ${peakflowSelector} tag.`,
        );
      }
    }
  }

  /**
   * Validates the mutually exclusive populated and empty collection states.
   *
   * A populated collection must have one direct list with at least one direct
   * item. An empty collection must have one direct empty-state element and no
   * list. These checks expose missing or duplicate `data-cms-element` tags instead
   * of silently treating mistagged DOM as empty.
   */
  private assertElementStructure(listElements: HTMLElement[], emptyStates: HTMLElement[]): void {
    if (listElements.length + emptyStates.length !== 1) {
      throw new Error(
        `CollectionList "${this.id}" requires exactly one direct list or empty-state element; found ${listElements.length} lists and ${emptyStates.length} empty states. Verify the "${this.attr.element}" tags.`,
      );
    }

    if (listElements.length === 1 && this.elements.length === 0) {
      const itemSelector = this.selector("item");

      throw new Error(
        `CollectionList "${this.id}" has a list element but no direct items matching "${itemSelector}".`,
      );
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

  public isEmpty(): boolean {
    return !this.listElement && this.emptyState !== null;
  }

  private assertSchema(): asserts this is this & {
    settings: CollectionListSettings<Item> & { schema: CollectionListPayloadSchema<Item> };
  } {
    if (!this.settings.schema) {
      throw new Error(`CollectionList "${this.id}" cannot parse items without a payload schema.`);
    }
  }

  private assertItemsMatchElements(): void {
    if (this.items.length !== this.elements.length) {
      throw new Error(
        "Items and elements are out of sync. Use the parse() method before performing this action.",
      );
    }
  }

  /**
   * Builds and validates the data for every item in this list.
   *
   * Configured nested lists are built first without schema validation.
   * `{{cms:id}}` inserts a nested list's complete item array, while
   * `{{cms:id.path}}` inserts an array containing that property from every nested
   * item. The current list's schema then validates the fully assembled object once.
   *
   * Items that fail with `PayloadValueError` are omitted from `items` and reported
   * together after the list is processed. Other errors stop parsing immediately.
   */
  public parse(options: Partial<ParseOptions> = {}): Item[] {
    this.assertSchema();

    this.items = [];

    if (this.isEmpty()) {
      return this.items;
    }

    const errors: unknown[] = [];

    for (const element of this.elements) {
      try {
        const materialized = this.materializeItem(element, options);
        const parsed = this.settings.schema.parseData(materialized);
        this.items.push(parsed);
      } catch (error) {
        if (error instanceof PayloadValueError) {
          errors.push(error);
        } else {
          throw error;
        }
      }
    }

    this.reportParseErrors(errors, this.elements.length);

    return this.items;
  }

  /**
   * Builds item objects for insertion into a parent collection.
   *
   * Variables are resolved, but schema validation is deferred because the
   * outermost list's schema owns the final shape, including every nested
   * collection.
   */
  private materialize(options: Partial<ParseOptions> = {}): MaterializedItem[] {
    if (this.isEmpty()) return [];

    return this.elements.map((element) => this.materializeItem(element, options));
  }

  /**
   * Assembles one item before the outermost schema validates it.
   *
   * Nested items are assembled first so the current item's `{{cms:...}}`
   * references receive actual arrays. Hydration happens at every level so DOM,
   * custom, and nested-collection references are resolved before insertion into a
   * parent item.
   */
  private materializeItem(
    itemElement: HTMLElement,
    options: Partial<ParseOptions>,
  ): MaterializedItem {
    const embed = this.getItemEmbed(itemElement);
    const raw = Payload.parseRaw(embed);

    this.assertMaterializedItem(raw);

    const nestedCollections = this.materializeNestedLists(itemElement, options);

    const resolvers: PayloadVariableResolvers = {
      dom: Payload.resolvers.dom(itemElement),
      var: Payload.resolvers.object(options.variables ?? {}),
      cms: CollectionList.createCmsResolver(nestedCollections),
    };

    return Payload.hydrate(raw, resolvers);
  }

  /**
   * Builds the nested collections configured for one item.
   *
   * Configuration, rather than arbitrary DOM descendants, defines which wrappers
   * become available through the `cms` resolver. This prevents deeper lists from
   * being assigned to the wrong parent level.
   */
  private materializeNestedLists(
    itemElement: HTMLElement,
    options: Partial<ParseOptions>,
  ): MaterializedCollections {
    const collections: MaterializedCollections = {};

    for (const [id, settings] of Object.entries(this.settings.nestedLists ?? {})) {
      const wrapper = this.getNestedWrapper(itemElement, id);

      const nestedList = new CollectionList(wrapper, {
        id,
        nestedLists: settings.nestedLists ?? {},
      });

      collections[id] = nestedList.materialize(options);
    }

    return collections;
  }

  /**
   * Finds the payload embed owned by one collection item.
   *
   * Embeds inside nested items are excluded. Requiring exactly one direct embed
   * prevents a parent item from silently reading a child's payload or choosing
   * between ambiguous payloads.
   */
  private getItemEmbed(itemElement: HTMLElement): HTMLScriptElement {
    const selector = `${Payload.selector("embed")}[${this.attr.id}="${CSS.escape(this.id)}"]`;
    const itemOwnershipSelector = this.selector("item");

    const embeds = Array.from(itemElement.querySelectorAll<HTMLScriptElement>(selector)).filter(
      (embed) => embed.closest(itemOwnershipSelector) === itemElement,
    );

    if (embeds.length === 0) {
      throw new Error(`CollectionList "${this.id}": No payload embed found for item.`);
    }

    if (embeds.length > 1) {
      throw new Error(`CollectionList "${this.id}": Found multiple payload embeds for one item.`);
    }

    return embeds[0];
  }

  /**
   * Finds the configured nested wrapper owned by one collection item.
   *
   * Only direct nested wrappers are eligible. Missing or duplicate wrappers mean
   * the DOM no longer matches `nestedLists` and are reported as configuration
   * errors.
   */
  private getNestedWrapper(itemElement: HTMLElement, id: string): HTMLElement {
    const selector = CollectionList.selector("wrapper", id);
    const itemOwnershipSelector = this.selector("item");

    const wrappers = Array.from(itemElement.querySelectorAll<HTMLElement>(selector)).filter(
      (wrapper) => wrapper.closest(itemOwnershipSelector) === itemElement,
    );

    if (wrappers.length === 0) {
      throw new Error(
        `CollectionList "${this.id}": Nested collection "${id}" is configured but no matching wrapper was found in the current item.`,
      );
    }

    if (wrappers.length > 1) {
      throw new Error(
        `CollectionList "${this.id}": Found multiple direct nested collection wrappers with id "${id}" in one item.`,
      );
    }

    return wrappers[0];
  }

  private assertMaterializedItem(value: unknown): asserts value is MaterializedItem {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError(`CollectionList "${this.id}": Item payload must contain a JSON object.`);
    }
  }

  /**
   * Creates the `cms` resolver for nested collection data.
   *
   * A path containing only a collection ID returns its complete item array.
   * Additional path segments return a projection: one resolved property value per
   * item, preserving collection order.
   */
  private static createCmsResolver(
    collections: Record<string, Record<string, unknown>[]>,
  ): PayloadVariableResolver {
    return ({ path }) => {
      const [collectionId, ...propertyPath] = path;

      if (!collectionId) {
        return undefined;
      }

      const items = collections[collectionId];

      if (!items) {
        return undefined;
      }

      if (propertyPath.length === 0) {
        return items;
      }

      return items.map((item) => {
        let current: unknown = item;

        for (const segment of propertyPath) {
          if (
            current === null ||
            typeof current !== "object" ||
            Array.isArray(current) ||
            !(segment in current)
          ) {
            return undefined;
          }

          current = (current as Record<string, unknown>)[segment];
        }

        return current;
      });
    };
  }

  /**
   * Produces one readable report for schema failures collected across the list.
   *
   * Failures are grouped first by payload path and then by message so repeated CMS
   * data problems do not flood the console with one stack trace per item.
   */
  private reportParseErrors(errors: unknown[], total: number): void {
    if (!errors.length) return;

    const errorMap = errors.reduce<Map<string, unknown[]>>((acc, error) => {
      const key = error instanceof PayloadValueError ? error.path.toString() : "__unknown__";

      const existing = acc.get(key) ?? [];
      existing.push(error);
      acc.set(key, existing);

      return acc;
    }, new Map());

    const lines: string[] = [];
    const styles: string[] = [];

    for (const [path, pathErrors] of errorMap) {
      const messages = new Map<string, number>();

      for (const error of pathErrors) {
        const message =
          error instanceof PayloadValueError
            ? error.cause instanceof Error
              ? error.cause.message
              : error.message
            : error instanceof Error
              ? error.message
              : String(error);

        messages.set(message, (messages.get(message) ?? 0) + 1);
      }

      lines.push(`%c${path}%c (${pathErrors.length})`);
      styles.push("color: #f19116; font-weight: bold;", "color: gray; font-weight: normal;");

      for (const [message, count] of messages) {
        lines.push(`  %c${count}×%c ${message}`);
        styles.push("color: #f19116; font-weight: bold;", "color: inherit; font-weight: normal;");
      }
    }

    console.error(
      `Failed to parse ${errors.length} of ${total} collection items.\n${lines.join("\n")}`,
      ...styles,
    );
  }

  /**
   * Shows only items accepted by the predicate without changing `items` or
   * `elements`.
   *
   * By default, rejected elements remain in the DOM with `hidden` set. With
   * `removeFromDom`, they are detached and later reinserted in collection order
   * when they match a subsequent filter.
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

    this.assertItemsMatchElements();

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
   * Sorts parsed items and moves their DOM elements into the same order.
   *
   * Both `items` and `elements` are mutated. Object identity links each parsed item
   * to its element, so the same item object must not appear more than once.
   */
  public sort(compareFn: CompareFn<Item>): Item[] {
    if (this.isEmpty()) return [];

    this.assertItemsMatchElements();

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
   * Provides programmatic strings through `{{var:name}}` references at every
   * nesting level.
   *
   * These values do not replace `{{dom:...}}` values. The `dom`, `var`, and `cms`
   * prefixes remain separate so data from one source cannot shadow another.
   */
  variables: PayloadVariables;
}

export interface FilterOptions {
  /**
   * Detaches rejected elements instead of hiding them.
   *
   * Detached elements remain tracked and can be reinserted by a later filter.
   *
   * @defaultValue `false`
   */
  removeFromDom: boolean;
}

export interface FilteredResponse<Item extends CollectionListItem> {
  items: Item[];
  visibleElements: HTMLElement[];
}
