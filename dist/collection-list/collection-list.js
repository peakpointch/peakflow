var _a;
import { Dataset } from "../selector/attributes.js";
import { wf } from "../webflow/webflow.js";
import { Selector } from "../selector/selector.js";
import { BaseComponent } from "../base-component/index.js";
import { Payload } from "../payload/payload.js";
import { PayloadValueError } from "../payload/schema.js";
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
export class CollectionList extends BaseComponent {
    constructor(component, settings = {}) {
        super(component, settings);
        this.dataset = _a.dataset;
        this.attr = this.dataset.attr;
        /**
         * Stores parsed items in the same order as `elements` after a successful
         * `parse()`.
         *
         * Filtering leaves this array unchanged. Sorting mutates both arrays to preserve
         * their positional relationship.
         */
        this.items = [];
        /**
         * Stores live item elements in the same order as `items`.
         *
         * Filtering may hide or detach elements but never removes them from this array.
         */
        this.elements = [];
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
    assertComponent() {
        const wrapperSelector = this.selector("wrapper");
        const attributeId = this.component.getAttribute(this.attr.id);
        if (!this.component.matches(wrapperSelector)) {
            throw new Error(`CollectionList must match the required root tag ${wrapperSelector}.`);
        }
        if (!attributeId) {
            throw new Error(`CollectionList must define the required "${this.attr.id}" attribute.`);
        }
        if (this.id !== attributeId) {
            throw new Error(`CollectionList id "${this.id}" must match the root's "${this.attr.id}" value "${attributeId}".`);
        }
    }
    initElements() {
        const listQuery = this.selector("list");
        const itemQuery = this.selector("item");
        const emptyQuery = this.selector("empty");
        const wrapperOwnershipSelector = this.selector("wrapper");
        // TODO: Select pagination elements
        this.assertWebflowElementTags();
        const listElements = Array.from(this.component.querySelectorAll(listQuery)).filter((element) => element.closest(wrapperOwnershipSelector) === this.component);
        const emptyStates = Array.from(this.component.querySelectorAll(emptyQuery)).filter((element) => element.closest(wrapperOwnershipSelector) === this.component);
        this.listElement = listElements[0] ?? null;
        this.emptyState = emptyStates[0] ?? null;
        this.elements = Array.from(this.listElement?.querySelectorAll(itemQuery) ?? []).filter((element) => element.closest(wrapperOwnershipSelector) === this.component);
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
    assertWebflowElementTags() {
        const roles = [
            ["list", wf.select.cmsList],
            ["item", wf.select.cmsItem],
            ["empty", wf.select.cmsEmpty],
        ];
        for (const [role, webflowSelector] of roles) {
            const peakflowSelector = this.selector(role);
            const untaggedElements = Array.from(this.component.querySelectorAll(webflowSelector)).filter((element) => element.closest(wf.select.cmsWrapper) === this.component &&
                !element.matches(peakflowSelector));
            if (untaggedElements.length > 0) {
                throw new Error(`CollectionList "${this.id}" found ${untaggedElements.length} direct Webflow ${role} element${untaggedElements.length === 1 ? "" : "s"} without the required ${peakflowSelector} tag.`);
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
    assertElementStructure(listElements, emptyStates) {
        if (listElements.length + emptyStates.length !== 1) {
            throw new Error(`CollectionList "${this.id}" requires exactly one direct list or empty-state element; found ${listElements.length} lists and ${emptyStates.length} empty states. Verify the "${this.attr.element}" tags.`);
        }
        if (listElements.length === 1 && this.elements.length === 0) {
            const itemSelector = this.selector("item");
            throw new Error(`CollectionList "${this.id}" has a list element but no direct items matching "${itemSelector}".`);
        }
    }
    isEmpty() {
        return !this.listElement && this.emptyState !== null;
    }
    assertSchema() {
        if (!this.settings.schema) {
            throw new Error(`CollectionList "${this.id}" cannot parse items without a payload schema.`);
        }
    }
    assertItemsMatchElements() {
        if (this.items.length !== this.elements.length) {
            throw new Error("Items and elements are out of sync. Use the parse() method before performing this action.");
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
    parse(options = {}) {
        this.assertSchema();
        this.items = [];
        if (this.isEmpty()) {
            return this.items;
        }
        const errors = [];
        for (const element of this.elements) {
            try {
                const materialized = this.materializeItem(element, options);
                const parsed = this.settings.schema.parseData(materialized);
                this.items.push(parsed);
            }
            catch (error) {
                if (error instanceof PayloadValueError) {
                    errors.push(error);
                }
                else {
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
    materialize(options = {}) {
        if (this.isEmpty())
            return [];
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
    materializeItem(itemElement, options) {
        const embed = this.getItemEmbed(itemElement);
        const raw = Payload.parseRaw(embed);
        this.assertMaterializedItem(raw);
        const nestedCollections = this.materializeNestedLists(itemElement, options);
        const resolvers = {
            dom: Payload.resolvers.dom(itemElement),
            var: Payload.resolvers.object(options.variables ?? {}),
            cms: _a.createCmsResolver(nestedCollections),
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
    materializeNestedLists(itemElement, options) {
        const collections = {};
        for (const [id, settings] of Object.entries(this.settings.nestedLists ?? {})) {
            const wrapper = this.getNestedWrapper(itemElement, id);
            const nestedList = new _a(wrapper, {
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
    getItemEmbed(itemElement) {
        const selector = `${Payload.selector("embed")}[${this.attr.id}="${CSS.escape(this.id)}"]`;
        const itemOwnershipSelector = this.selector("item");
        const embeds = Array.from(itemElement.querySelectorAll(selector)).filter((embed) => embed.closest(itemOwnershipSelector) === itemElement);
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
    getNestedWrapper(itemElement, id) {
        const selector = _a.selector("wrapper", id);
        const itemOwnershipSelector = this.selector("item");
        const wrappers = Array.from(itemElement.querySelectorAll(selector)).filter((wrapper) => wrapper.closest(itemOwnershipSelector) === itemElement);
        if (wrappers.length === 0) {
            throw new Error(`CollectionList "${this.id}": Nested collection "${id}" is configured but no matching wrapper was found in the current item.`);
        }
        if (wrappers.length > 1) {
            throw new Error(`CollectionList "${this.id}": Found multiple direct nested collection wrappers with id "${id}" in one item.`);
        }
        return wrappers[0];
    }
    assertMaterializedItem(value) {
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
    static createCmsResolver(collections) {
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
                let current = item;
                for (const segment of propertyPath) {
                    if (current === null ||
                        typeof current !== "object" ||
                        Array.isArray(current) ||
                        !(segment in current)) {
                        return undefined;
                    }
                    current = current[segment];
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
    reportParseErrors(errors, total) {
        if (!errors.length)
            return;
        const errorMap = errors.reduce((acc, error) => {
            const key = error instanceof PayloadValueError ? error.path.toString() : "__unknown__";
            const existing = acc.get(key) ?? [];
            existing.push(error);
            acc.set(key, existing);
            return acc;
        }, new Map());
        const lines = [];
        const styles = [];
        for (const [path, pathErrors] of errorMap) {
            const messages = new Map();
            for (const error of pathErrors) {
                const message = error instanceof PayloadValueError
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
        console.error(`Failed to parse ${errors.length} of ${total} collection items.\n${lines.join("\n")}`, ...styles);
    }
    /**
     * Shows only items accepted by the predicate without changing `items` or
     * `elements`.
     *
     * By default, rejected elements remain in the DOM with `hidden` set. With
     * `removeFromDom`, they are detached and later reinserted in collection order
     * when they match a subsequent filter.
     */
    filter(predicate, options = {}) {
        const opts = {
            removeFromDom: options.removeFromDom ?? false,
        };
        const items = [];
        const visibleElements = [];
        if (this.isEmpty())
            return { items, visibleElements };
        this.assertItemsMatchElements();
        let lastVisibleElement = null;
        const reinsertElement = (element) => {
            if (lastVisibleElement) {
                lastVisibleElement.insertAdjacentElement("afterend", element);
            }
            else {
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
                }
                else {
                    element.hidden = false;
                }
                items.push(item);
                visibleElements.push(element);
            }
            else {
                if (opts.removeFromDom) {
                    element.remove();
                }
                else {
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
    sort(compareFn) {
        if (this.isEmpty())
            return [];
        this.assertItemsMatchElements();
        const elementMap = new Map();
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
_a = CollectionList;
CollectionList.defaultSettings = {
    id: null,
    nestedLists: {},
};
CollectionList.dataset = Dataset.define({
    id: Dataset.String("data-cms-id"),
    element: Dataset.String("data-cms-element"),
    key: Dataset.String("key"),
});
CollectionList.attr = _a.dataset.attr;
CollectionList.attributeSelector = Selector.attr(_a.attr.element);
CollectionList.selector = Selector.instance(_a.attributeSelector, _a.attr, { root: "wrapper" });
CollectionList.select = Selector.select(_a.selector);
CollectionList.selectAll = Selector.selectAll(_a.selector);
