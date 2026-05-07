import { Selector, Dataset } from "../selector/";
/**
 * A Singleton used for parsing JSON from the DOM.
 */
export class Payload {
    constructor() {
        this.attributeSelector = Selector.attr(Payload.dataset.attr.element);
        this.selector = Selector.instance(this.attributeSelector, Payload.dataset.attr, { root: "embed", scoped: false });
        this.select = Selector.select(this.selector);
        this.selectAll = Selector.selectAll(this.selector);
    }
    static getInstance() {
        if (!Payload.instance) {
            Payload.instance = new Payload();
        }
        return Payload.instance;
    }
    // public select<U extends Element = HTMLElement>(element: string, doc?: Document | Element): U {
    //   return (doc ?? document).querySelector<U>(this.selector(element));
    // }
    /**
     * Retrieves and parses a JSON Data Island from the DOM by its unique ID.
     *
     * @template T - The expected shape of the parsed data, extending `PayloadData`.
     * @param id - The value of the `data-payload-id` attribute to search for.
     * @param options - Configuration options, such as providing a custom `Document` root.
     * @returns The parsed JSON content cast as type `T`.
     *
     * ### Example HTML
     * ```html
     * <script type="application/json" data-payload-id="unique-id"></script>
     * ```
     */
    get(id, options) {
        const opts = {
            doc: options?.doc ?? document,
        };
        const embed = this.select("embed", id, { doc: opts.doc });
        return this.parse(embed);
    }
    /**
     * Parses JSON data from a `HTMLScriptElement`.
     *
     * @template T - The expected shape of the parsed data, extending `PayloadData`.
     * @returns The parsed JSON content cast as type `T`.
     *
     * ### Example HTML
     * ```html
     * <script type="application/json"></script>
     * ```
     */
    parse(embed) {
        if (!(embed instanceof HTMLScriptElement) || embed.type !== "application/json") {
            throw new Error(`Failed to parse payload: Invalid payload embed element.`);
        }
        let payload;
        try {
            payload = JSON.parse(embed.textContent);
        }
        catch (err) {
            throw new Error(`Failed to parse payload: ${err.message}`);
        }
        return payload;
    }
}
Payload.dataset = Dataset.define({
    id: Dataset.String("data-payload-id"),
    element: Dataset.String("data-payload-element"),
});
export const payload = Payload.getInstance();
