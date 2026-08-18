import { Path } from "../path/path.js";
import { Payload } from "./payload.js";
/**
 * Reports a schema failure at the exact property or array item that failed.
 *
 * `path` locates the value within the payload. `cause` retains the original type
 * error or error thrown by a custom parser.
 */
export class PayloadValueError extends TypeError {
    constructor(path, message, options) {
        super(`Failed to parse payload value "${path}": ${message}`, options);
        this.path = path.toString();
    }
}
/**
 * Turns payload JSON into validated application data.
 *
 * A schema defines both the runtime contract and the inferred TypeScript types.
 * Parsing has three phases: read the JSON, replace variable references, then
 * validate and transform each value in the definition. Properties not included
 * in the definition are omitted from the parsed result.
 */
export class PayloadSchema {
    constructor(definition, options) {
        this.path = new Path("");
        this.definition = definition;
        this.options = {
            primitivesFromString: options?.primitivesFromString ?? false,
        };
    }
    /**
     * Runs the full payload pipeline for one JSON embed.
     *
     * - `{{dom:name}}` reads values from the embed's parent element
     * - `{{var:path}}` reads from `options.variables`.
     * Custom resolvers are merged last, so they can add prefixes or
     * replace either built-in resolver.
     */
    parse(embed, options = {}) {
        const raw = this.parseRaw(embed);
        const resolvers = {
            dom: Payload.resolvers.dom(embed.parentElement),
            var: Payload.resolvers.object(options.variables ?? {}),
            ...options.resolvers,
        };
        const hydrated = Payload.hydrate(raw, resolvers);
        return this.parseDefinition(hydrated, this.definition);
    }
    /**
     * Applies the schema to a JavaScript value that has already been assembled.
     *
     * This skips JSON parsing and variable hydration. It is intended for callers
     * such as collection lists that inject nested data before schema validation.
     */
    parseData(value) {
        return this.parseDefinition(value, this.definition);
    }
    /**
     * Reads the embed as the schema's inferred input type without applying the
     * schema.
     *
     * The inferred type is not runtime validation; malformed JSON shapes are only
     * rejected by `parse()`, `get()`, or `parseData()`.
     */
    parseRaw(embed) {
        return Payload.parseRaw(embed);
    }
    /**
     * Finds an embed whose `data-payload-id` matches `id` and runs the full parsing
     * pipeline.
     *
     * The global document is searched unless `options.doc` provides a narrower
     * document or element root.
     */
    get(id, options = {}) {
        const embed = this.getEmbed(id, options.doc ?? document);
        return this.parse(embed, {
            variables: options.variables,
            resolvers: options.resolvers,
        });
    }
    /**
     * Finds an embed whose `data-payload-id` matches `id` and returns its JSON
     * before hydration and validation.
     */
    getRaw(id, options = {}) {
        const embed = this.getEmbed(id, options.doc ?? document);
        return this.parseRaw(embed);
    }
    /**
     * Owns path scoping for object properties.
     *
     * Each property starts from the parent path so nested parsing can append its
     * location without leaking that location into the next property.
     */
    parseDefinition(value, definition) {
        this.assertObject(value);
        const parsed = {};
        for (const [key, valueDefinition] of Object.entries(definition)) {
            this.path.withSnapshot((path) => {
                path.down(key);
                parsed[key] = this.parseValue(value[key], valueDefinition);
            });
        }
        return parsed;
    }
    /**
     * Provides one error boundary for descriptors, nested schemas, and custom
     * parsers.
     *
     * Errors are wrapped with the current payload path once. An existing
     * `PayloadValueError` is preserved so deeper paths are not replaced by a parent
     * path.
     */
    parseValue(value, definition) {
        try {
            if (definition instanceof PayloadSchema) {
                return this.parseSchema(value, definition);
            }
            if (typeof definition === "function") {
                return this.parseCustom(value, definition);
            }
            if (value === null || value === undefined) {
                return this.parseMissingValue(definition);
            }
            switch (definition.kind) {
                case "string":
                case "number":
                case "boolean":
                    return this.parsePrimitive(value, definition);
                case "object":
                    return this.parseObject(value, definition);
                case "array":
                    return this.parseArray(value, definition);
            }
        }
        catch (error) {
            if (error instanceof PayloadValueError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : String(error);
            throw new PayloadValueError(this.path, message, { cause: error });
        }
    }
    parsePrimitive(value, descriptor) {
        switch (descriptor.kind) {
            case "string":
                return this.parseString(value);
            case "number":
                return this.parseNumber(value, descriptor);
            case "boolean":
                return this.parseBoolean(value, descriptor);
        }
    }
    parseString(value) {
        if (typeof value !== "string") {
            throw new TypeError(`Expected payload value to be a string, received ${typeof value}.`);
        }
        return value;
    }
    parseNumber(value, descriptor) {
        if (this.options.primitivesFromString) {
            if (typeof value !== "string") {
                throw new TypeError(`Expected payload number to be a string, received ${typeof value}.`);
            }
            const normalized = value.trim();
            if (normalized === "") {
                return this.parseMissingValue(descriptor);
            }
            const parsed = Number(normalized);
            if (!Number.isFinite(parsed)) {
                throw new TypeError(`Failed to parse payload number from "${value}".`);
            }
            return parsed;
        }
        if (typeof value !== "number") {
            const hint = typeof value === "string" ? ` Did you forget to enable "primitivesFromString"?` : "";
            throw new TypeError(`Expected payload value to be a number, received ${typeof value}.${hint}`);
        }
        return value;
    }
    parseBoolean(value, descriptor) {
        if (this.options.primitivesFromString) {
            if (typeof value !== "string") {
                throw new TypeError(`Expected payload boolean to be a string, received ${typeof value}.`);
            }
            const normalized = value.trim();
            if (normalized === "") {
                return this.parseMissingValue(descriptor);
            }
            if (normalized === "true") {
                return true;
            }
            if (normalized === "false") {
                return false;
            }
            throw new TypeError(`Failed to parse payload boolean from "${value}".`);
        }
        if (typeof value !== "boolean") {
            const hint = typeof value === "string" ? ` Did you forget to enable "primitivesFromString"?` : "";
            throw new TypeError(`Expected payload value to be a boolean, received ${typeof value}.${hint}`);
        }
        return value;
    }
    parseObject(value, descriptor) {
        if (descriptor.definition instanceof PayloadSchema) {
            return this.parseSchema(value, descriptor.definition);
        }
        return this.parseDefinition(value, descriptor.definition);
    }
    parseArray(value, descriptor) {
        this.assertArray(value);
        return value.map((item, index) => this.path.withSnapshot((path) => {
            path.down(index);
            return this.parseValue(item, descriptor.item);
        }));
    }
    /**
     * Temporarily prefixes a nested schema with its location in the parent payload.
     *
     * The nested schema restores its previous path afterward, allowing the same
     * schema instance to be reused at multiple properties without retaining state
     * from an earlier parse.
     */
    parseSchema(value, schema) {
        return schema.path.withSnapshot(() => {
            schema.path.prefix(this.path.toString());
            return schema.parseDefinition(value, schema.definition);
        });
    }
    parseCustom(value, parser) {
        return parser(value);
    }
    assertObject(value) {
        if (value === null || typeof value !== "object" || Array.isArray(value)) {
            throw new TypeError(`Expected payload value to be a plain object.`);
        }
    }
    assertArray(value) {
        if (!Array.isArray(value)) {
            throw new TypeError(`Expected payload value to be an array.`);
        }
    }
    parseMissingValue(descriptor) {
        if (descriptor.required) {
            throw new TypeError(`This value is required.`);
        }
        return descriptor.default;
    }
    getEmbed(id, doc) {
        const embed = Payload.select("embed", id, { doc });
        if (!embed) {
            throw new Error(`Failed to get payload: No payload embed found with id "${id}".`);
        }
        return embed;
    }
}
