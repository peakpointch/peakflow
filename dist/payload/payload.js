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
     * Parses JSON data from a `HTMLScriptElement` and hydrates the data.
     *
     * @template T - The expected shape of the parsed data, extending `PayloadData`.
     * @param variables - The variables to hydrate the JSON data with. Variables are parsed from `embed.parentElement` if no variables are provided.
     * @returns The parsed JSON content cast as type `T`.
     *
     * ### Example HTML
     * ```html
     * <script type="application/json"></script>
     * ```
     */
    parse(embed, variables) {
        const data = this.parseRaw(embed);
        const vars = variables ?? this.parseVariables(embed.parentElement);
        return this.hydrate(data, vars);
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
    parseRaw(embed) {
        if (!(embed instanceof HTMLScriptElement) || embed.type !== "application/json") {
            throw new Error(`Failed to parse payload: Invalid payload embed element.`);
        }
        let data;
        const raw = embed.textContent.trim() || "{}";
        try {
            data = JSON.parse(raw);
        }
        catch (err) {
            throw new Error(`Failed to parse payload: ${raw}\n\n${err.message}`);
        }
        return data;
    }
    parseVariables(doc) {
        const fields = this.selectAll("var", undefined, { doc: doc });
        const variables = {};
        fields.forEach((el) => {
            const dataset = Payload.dataset.parse(el);
            if (dataset.var) {
                variables[dataset.var] = el.innerHTML;
            }
        });
        return variables;
    }
    hydrate(payload, variables) {
        if (payload === null || typeof payload !== "object") {
            return payload;
        }
        if (Array.isArray(payload)) {
            return payload.map((item) => this.hydrate(item, variables));
        }
        for (const key in payload) {
            const val = payload[key];
            if (val === null)
                continue;
            switch (typeof val) {
                case "object":
                    payload[key] = this.hydrate(val, variables);
                    break;
                case "string":
                    payload[key] = this.hydrateValue(val, variables);
                    break;
            }
        }
        return payload;
    }
    hydrateValue(value, variables) {
        const variableSyntax = /\$\{([^}]+)\}/g;
        const missingVars = [];
        const hydrated = value.replace(variableSyntax, (match, varName) => {
            if (varName in variables) {
                return variables[varName];
            }
            else {
                missingVars.push(varName);
                return match;
            }
        });
        if (missingVars.length) {
            console.warn(`Payload: Found ${missingVars.length} missing variables (${missingVars.join(", ")}) in the following value:\n`, hydrated);
        }
        return hydrated;
    }
}
Payload.dataset = Dataset.define({
    id: Dataset.String("data-payload-id"),
    element: Dataset.String("data-payload-element"),
    var: Dataset.String("data-payload-var"),
});
export const payload = Payload.getInstance();
