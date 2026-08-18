import { Path } from "../path/path.js";
import type { GetPayloadOptions, InferParsedDefinition, InferRawDefinition, PayloadDefinition, PayloadParseOptions, PayloadSchemaOptions } from "./types.js";
/**
 * Reports a schema failure at the exact property or array item that failed.
 *
 * `path` locates the value within the payload. `cause` retains the original type
 * error or error thrown by a custom parser.
 */
export declare class PayloadValueError extends TypeError {
    path: string;
    constructor(path: Path, message: string, options?: ErrorOptions);
}
/**
 * Turns payload JSON into validated application data.
 *
 * A schema defines both the runtime contract and the inferred TypeScript types.
 * Parsing has three phases: read the JSON, replace variable references, then
 * validate and transform each value in the definition. Properties not included
 * in the definition are omitted from the parsed result.
 */
export declare class PayloadSchema<const Definition extends PayloadDefinition, const Options extends PayloadSchemaOptions = {}> {
    private readonly definition;
    private readonly options;
    private path;
    constructor(definition: Definition, options?: Options);
    /**
     * Runs the full payload pipeline for one JSON embed.
     *
     * - `{{dom:name}}` reads values from the embed's parent element
     * - `{{var:path}}` reads from `options.variables`.
     * Custom resolvers are merged last, so they can add prefixes or
     * replace either built-in resolver.
     */
    parse(embed: HTMLScriptElement, options?: PayloadParseOptions): InferParsedDefinition<Definition>;
    /**
     * Applies the schema to a JavaScript value that has already been assembled.
     *
     * This skips JSON parsing and variable hydration. It is intended for callers
     * such as collection lists that inject nested data before schema validation.
     */
    parseData(value: unknown): InferParsedDefinition<Definition>;
    /**
     * Reads the embed as the schema's inferred input type without applying the
     * schema.
     *
     * The inferred type is not runtime validation; malformed JSON shapes are only
     * rejected by `parse()`, `get()`, or `parseData()`.
     */
    parseRaw(embed: HTMLScriptElement): InferRawDefinition<Definition, Options>;
    /**
     * Finds an embed whose `data-payload-id` matches `id` and runs the full parsing
     * pipeline.
     *
     * The global document is searched unless `options.doc` provides a narrower
     * document or element root.
     */
    get(id: string, options?: Partial<GetPayloadOptions>): InferParsedDefinition<Definition>;
    /**
     * Finds an embed whose `data-payload-id` matches `id` and returns its JSON
     * before hydration and validation.
     */
    getRaw(id: string, options?: Partial<GetPayloadOptions>): InferRawDefinition<Definition, Options>;
    /**
     * Owns path scoping for object properties.
     *
     * Each property starts from the parent path so nested parsing can append its
     * location without leaking that location into the next property.
     */
    private parseDefinition;
    /**
     * Provides one error boundary for descriptors, nested schemas, and custom
     * parsers.
     *
     * Errors are wrapped with the current payload path once. An existing
     * `PayloadValueError` is preserved so deeper paths are not replaced by a parent
     * path.
     */
    private parseValue;
    private parsePrimitive;
    private parseString;
    private parseNumber;
    private parseBoolean;
    private parseObject;
    private parseArray;
    /**
     * Temporarily prefixes a nested schema with its location in the parent payload.
     *
     * The nested schema restores its previous path afterward, allowing the same
     * schema instance to be reused at multiple properties without retaining state
     * from an earlier parse.
     */
    private parseSchema;
    private parseCustom;
    private assertObject;
    private assertArray;
    private parseMissingValue;
    private getEmbed;
}
