import { Dataset } from "../selector/";
import { PayloadSchema } from "./schema.js";
import type { InferRawDefinition, InferParsedDefinition, PayloadArrayDescriptor, PayloadBooleanDescriptor, PayloadData, PayloadDefinition, PayloadElement, PayloadNumberDescriptor, PayloadObjectDefinition, PayloadObjectDescriptor, PayloadSchemaOptions, PayloadStringDescriptor, PayloadValueDefinition, PayloadValueOptions, PayloadVariableReference, PayloadVariableResolver, PayloadVariableResolvers } from "./types.js";
export declare namespace Payload {
    /**
     * Infers the schema's input before hydration and validation.
     *
     * The result reflects options such as `primitivesFromString` and marks optional
     * fields as potentially absent.
     */
    type Raw<Schema extends PayloadSchema<any, any>> = Schema extends PayloadSchema<infer Definition, infer Options> ? InferRawDefinition<Definition, Options> : never;
    /**
     * Infers the schema's output after validation, conversion, and defaults.
     */
    type Parsed<Schema extends PayloadSchema<any, any>> = Schema extends PayloadSchema<infer Definition, any> ? InferParsedDefinition<Definition> : never;
}
/**
 * Entry point for defining payload schemas and value descriptors.
 *
 * Most consumers create a schema with `define()` and use the schema's parsing
 * methods. The remaining methods support integrations that need direct access
 * to JSON parsing, variable discovery, or hydration.
 */
export declare class Payload {
    static dataset: Dataset<{
        id: import("..").DatasetAttribute<"data-payload-id", any>;
        element: import("..").DatasetAttribute<string, PayloadElement>;
        var: import("..").DatasetAttribute<"data-payload-var", any>;
    }>;
    static readonly resolvers: {
        /**
         * Creates a resolver for values rendered into the DOM by Webflow.
         *
         * A `{{dom:name}}` reference searches the supplied root for the first
         * `data-payload-var="name"` element and returns its HTML. DOM references use
         * one path segment; additional segments are ignored.
         */
        dom(doc: Document | Element): PayloadVariableResolver;
        /**
         * Creates a resolver backed by an object.
         *
         * Each dot-separated path segment selects the next property. For example, a
         * resolver registered as `data` reads `{{data:product.slug}}` from
         * `values.product.slug`. A missing property returns `undefined`, which
         * hydration treats as an unresolved reference.
         */
        object(values: Record<string, unknown>): PayloadVariableResolver;
    };
    private static readonly variableTokenSyntax;
    private static readonly exactVariableSyntax;
    private constructor();
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
    static define<const Definition extends PayloadDefinition, const Options extends PayloadSchemaOptions = {}>(definition: Definition, options?: Options): PayloadSchema<Definition, Options>;
    static String<const Required extends boolean = true, Default extends string | null | undefined = undefined>(options?: PayloadValueOptions<Required, Default>): PayloadStringDescriptor<Required, Default>;
    static Number<const Required extends boolean = true, Default extends number | null | undefined = undefined>(options?: PayloadValueOptions<Required, Default>): PayloadNumberDescriptor<Required, Default>;
    static Boolean<const Required extends boolean = true, Default extends boolean | null | undefined = undefined>(options?: PayloadValueOptions<Required, Default>): PayloadBooleanDescriptor<Required, Default>;
    static Object<const Definition extends PayloadObjectDefinition, const Required extends boolean = true, Default = undefined>(definition: Definition, options?: PayloadValueOptions<Required, Default>): PayloadObjectDescriptor<Definition, Required, Default>;
    static Array<const Item extends PayloadValueDefinition, const Required extends boolean = true, Default = undefined>(item: Item, options?: PayloadValueOptions<Required, Default>): PayloadArrayDescriptor<Item, Required, Default>;
    protected static attributeSelector: import("..").AttributeSelector<PayloadElement>;
    static selector: import("..").InstanceSelector<PayloadElement>;
    static select: <U extends Element = HTMLElement>(this: unknown, element: PayloadElement, instance?: string, options?: import("..").SelectOptions) => U;
    static selectAll: <U extends Element = HTMLElement>(this: unknown, element: PayloadElement, instance?: string, options?: import("..").SelectOptions) => NodeListOf<U>;
    /**
     * Reads JSON from an `application/json` script without applying variables or a
     * schema.
     *
     * An empty script is treated as `{}`. The generic type is only a TypeScript
     * assertion; use a schema when the value must be validated at runtime.
     */
    static parseRaw<T extends PayloadData = PayloadData>(embed: HTMLScriptElement): T;
    /**
     * Parses a string that consists of one complete `{{prefix:path}}` reference.
     *
     * The prefix selects a resolver and the dot-separated path is passed to that
     * resolver. Strings containing surrounding text are not complete references
     * and return `null`.
     */
    static parseVariableReference(value: string): PayloadVariableReference | null;
    /**
     * Collects references from every string in an object or array.
     *
     * Unlike `parseVariableReference()`, this also finds references embedded in
     * surrounding text. Use `prefix` to collect references owned by one resolver.
     */
    static findVariableReferences(value: unknown, options?: {
        prefix?: string;
    }): PayloadVariableReference[];
    /**
     * Owns resolver selection so complete references and text interpolation handle
     * missing prefixes consistently.
     */
    private static resolveVariableReference;
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
    static hydrate<T extends PayloadData>(payload: T, resolvers: PayloadVariableResolvers): T;
    /**
     * Applies the two forms of string hydration.
     *
     * When the entire string is one reference, that string is a placeholder and may
     * be replaced by any resolved value, including an object or array. When a
     * reference appears inside surrounding text, it is interpolation and must
     * resolve to a string. Missing values leave their original reference intact.
     */
    private static hydrateValue;
    private static warnMissingVariable;
}
