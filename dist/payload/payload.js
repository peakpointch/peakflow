var _a;
import { Selector, Dataset } from "../selector/";
import { PayloadSchema } from "./schema.js";
/**
 * Entry point for defining payload schemas and value descriptors.
 *
 * Most consumers create a schema with `define()` and use the schema's parsing
 * methods. The remaining methods support integrations that need direct access
 * to JSON parsing, variable discovery, or hydration.
 */
export class Payload {
    constructor() { }
    /**
     * Creates a schema from descriptors, nested schemas, and custom parsers.
     *
     * The definition controls runtime validation and is also the source for the
     * inferred `Payload.Raw` and `Payload.Parsed` types.
     *
     * @example
     * ```ts
     * const product = Payload.define({
     *   name: Payload.String(),
     *   price: Payload.Number(),
     * });
     * ```
     */
    static define(definition, options) {
        return new PayloadSchema(definition, options);
    }
    static String(options = {}) {
        return {
            __payloadDescriptor: true,
            kind: "string",
            required: (options.required ?? true),
            default: options.default,
        };
    }
    static Number(options = {}) {
        return {
            __payloadDescriptor: true,
            kind: "number",
            required: (options.required ?? true),
            default: options.default,
        };
    }
    static Boolean(options = {}) {
        return {
            __payloadDescriptor: true,
            kind: "boolean",
            required: (options.required ?? true),
            default: options.default,
        };
    }
    static Object(definition, options = {}) {
        return {
            __payloadDescriptor: true,
            kind: "object",
            definition,
            required: (options.required ?? true),
            default: options.default,
        };
    }
    static Array(item, options = {}) {
        return {
            __payloadDescriptor: true,
            kind: "array",
            item,
            required: (options.required ?? true),
            default: options.default,
        };
    }
    /**
     * Reads JSON from an `application/json` script without applying variables or a
     * schema.
     *
     * An empty script is treated as `{}`. The generic type is only a TypeScript
     * assertion; use a schema when the value must be validated at runtime.
     */
    static parseRaw(embed) {
        if (!(embed instanceof HTMLScriptElement) || embed.type !== "application/json") {
            throw new Error(`Failed to parse payload: Invalid payload embed element.`);
        }
        const raw = embed.textContent?.trim() || "{}";
        try {
            return JSON.parse(raw);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to parse payload: ${raw}\n\n${message}`);
        }
    }
    /**
     * Parses a string that consists of one complete `{{prefix:path}}` reference.
     *
     * The prefix selects a resolver and the dot-separated path is passed to that
     * resolver. Strings containing surrounding text are not complete references
     * and return `null`.
     */
    static parseVariableReference(value) {
        const match = value.match(this.exactVariableSyntax);
        if (!match) {
            return null;
        }
        const prefix = match[1];
        const path = match[2]
            .split(".")
            .map((segment) => segment.trim())
            .filter(Boolean);
        if (!path.length) {
            return null;
        }
        return {
            raw: match[0],
            prefix,
            path,
        };
    }
    /**
     * Collects references from every string in an object or array.
     *
     * Unlike `parseVariableReference()`, this also finds references embedded in
     * surrounding text. Use `prefix` to collect references owned by one resolver.
     */
    static findVariableReferences(value, options = {}) {
        const references = [];
        const visit = (value) => {
            if (typeof value === "string") {
                for (const match of value.matchAll(this.variableTokenSyntax)) {
                    const reference = this.parseVariableReference(match[0]);
                    if (reference && (!options.prefix || reference.prefix === options.prefix)) {
                        references.push(reference);
                    }
                }
                return;
            }
            if (Array.isArray(value)) {
                value.forEach(visit);
                return;
            }
            if (value && typeof value === "object") {
                Object.values(value).forEach(visit);
            }
        };
        visit(value);
        return references;
    }
    /**
     * Owns resolver selection so complete references and text interpolation handle
     * missing prefixes consistently.
     */
    static resolveVariableReference(reference, resolvers) {
        const resolver = resolvers[reference.prefix];
        if (!resolver) {
            console.warn(`Payload: missing resolver "${reference.prefix}".`);
            return undefined;
        }
        return resolver(reference);
    }
    /**
     * Replaces variable references in every string contained in a payload.
     *
     * The prefix in `{{prefix:path}}` selects a resolver. A string containing only
     * one reference may resolve to any value, which allows arrays and objects to be
     * inserted into JSON. A reference surrounded by text must resolve to a string
     * because it becomes part of that text. Unresolved references remain unchanged.
     *
     * Object properties are updated in place. Arrays are returned as new arrays, so
     * callers must use the return value when hydrating an array directly.
     */
    static hydrate(payload, resolvers) {
        if (payload === null || typeof payload !== "object") {
            return payload;
        }
        if (Array.isArray(payload)) {
            return payload.map((item) => typeof item === "string"
                ? this.hydrateValue(item, resolvers)
                : this.hydrate(item, resolvers));
        }
        for (const key in payload) {
            const value = payload[key];
            if (value === null)
                continue;
            switch (typeof value) {
                case "string":
                    payload[key] = this.hydrateValue(value, resolvers);
                    break;
                case "object":
                    payload[key] = this.hydrate(value, resolvers);
                    break;
            }
        }
        return payload;
    }
    /**
     * Applies the two forms of string hydration.
     *
     * When the entire string is one reference, that string is a placeholder and may
     * be replaced by any resolved value, including an object or array. When a
     * reference appears inside surrounding text, it is interpolation and must
     * resolve to a string. Missing values leave their original reference intact.
     */
    static hydrateValue(value, resolvers) {
        const exactReference = this.parseVariableReference(value);
        if (exactReference) {
            const resolved = this.resolveVariableReference(exactReference, resolvers);
            if (resolved === undefined) {
                this.warnMissingVariable(exactReference);
                return value;
            }
            return resolved;
        }
        return value.replace(this.variableTokenSyntax, (match) => {
            const reference = this.parseVariableReference(match);
            if (!reference) {
                return match;
            }
            const resolved = this.resolveVariableReference(reference, resolvers);
            if (resolved === undefined) {
                this.warnMissingVariable(reference);
                return match;
            }
            if (typeof resolved !== "string") {
                throw new TypeError(`Payload variable "${reference.raw}" resolved to ${typeof resolved}, but non-string values can only be used as complete values.`);
            }
            return resolved;
        });
    }
    static warnMissingVariable(reference) {
        console.warn(`Payload: Could not resolve variable "${reference.raw}".`);
    }
}
_a = Payload;
Payload.dataset = Dataset.define({
    id: Dataset.String("data-payload-id"),
    element: Dataset.String("data-payload-element"),
    var: Dataset.String("data-payload-var"),
});
Payload.resolvers = {
    /**
     * Creates a resolver for values rendered into the DOM by Webflow.
     *
     * A `{{dom:name}}` reference searches the supplied root for the first
     * `data-payload-var="name"` element and returns its HTML. DOM references use
     * one path segment; additional segments are ignored.
     */
    dom(doc) {
        return ({ path }) => {
            const [name] = path;
            if (!name) {
                return undefined;
            }
            const fields = _a.selectAll("var", undefined, { doc });
            for (const el of fields) {
                const dataset = _a.dataset.parse(el);
                if (dataset.var === name) {
                    return el.innerHTML;
                }
            }
            return undefined;
        };
    },
    /**
     * Creates a resolver backed by an object.
     *
     * Each dot-separated path segment selects the next property. For example, a
     * resolver registered as `data` reads `{{data:product.slug}}` from
     * `values.product.slug`. A missing property returns `undefined`, which
     * hydration treats as an unresolved reference.
     */
    object(values) {
        return ({ path }) => {
            let current = values;
            for (const segment of path) {
                if (current === null || typeof current !== "object" || !(segment in current)) {
                    return undefined;
                }
                current = current[segment];
            }
            return current;
        };
    },
};
Payload.variableTokenSyntax = /\{\{([A-Za-z][\w-]*):([^{}]+)\}\}/g;
Payload.exactVariableSyntax = /^\{\{([A-Za-z][\w-]*):([^{}]+)\}\}$/;
Payload.attributeSelector = Selector.attr(_a.dataset.attr.element);
Payload.selector = Selector.instance(_a.attributeSelector, _a.dataset.attr, {
    root: "embed",
    scoped: false,
});
Payload.select = Selector.select(_a.selector);
Payload.selectAll = Selector.selectAll(_a.selector);
