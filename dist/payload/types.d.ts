import type { Attribute, Attributes } from "../selector";
import type { PayloadSchema } from "./schema.js";
export type PayloadElement = "embed" | "var";
export type PayloadData = Record<string, any> | Array<any>;
/**
 * Programmatic string values exposed through `{{var:name}}` references.
 */
export type PayloadVariables = Record<string, string>;
/**
 * The parts of a `{{prefix:path.to.value}}` reference passed to a resolver.
 *
 * `prefix` identifies the resolver, `path` contains the dot-separated lookup
 * segments, and `raw` preserves the original reference for diagnostics.
 */
export interface PayloadVariableReference {
    readonly raw: string;
    readonly prefix: string;
    readonly path: readonly string[];
}
/**
 * Supplies a value for one variable reference.
 *
 * Returning `undefined` marks the reference as unresolved. All other values,
 * including `null`, `false`, and empty strings, are valid resolved values.
 */
export type PayloadVariableResolver = (reference: PayloadVariableReference) => unknown | undefined;
/**
 * Maps reference prefixes to their resolvers.
 *
 * For example, the `cms` entry handles every `{{cms:...}}` reference.
 */
export type PayloadVariableResolvers = Record<string, PayloadVariableResolver>;
export interface PayloadParseOptions {
    /**
     * Values exposed through the built-in `{{var:name}}` resolver.
     */
    variables?: PayloadVariables;
    /**
     * Adds reference prefixes or replaces the built-in `dom` and `var` resolvers.
     */
    resolvers?: PayloadVariableResolvers;
}
export interface PayloadAttributes extends Attributes {
    id: Attribute<string, string>;
    element: Attribute<string, PayloadElement>;
    var: Attribute<string, string>;
}
export interface PayloadSchemaOptions {
    /**
     * Treats numbers and booleans as strings before schema parsing.
     *
     * This is intended for Webflow values, where primitives are commonly rendered
     * as text. Numbers must be finite numeric strings; booleans must be `"true"` or
     * `"false"`. Whitespace is trimmed, and an empty string is treated as missing.
     */
    primitivesFromString?: boolean;
}
export interface GetPayloadOptions extends PayloadParseOptions {
    doc: Document | Element;
}
/**
 * Defines validation or transformation that the built-in descriptors do not
 * provide.
 *
 * The returned value becomes the parsed field value. A thrown error is wrapped in
 * `PayloadValueError` with the field's path.
 */
export type PayloadParser<Raw = unknown, Parsed = unknown> = (value: Raw) => Parsed;
export interface PayloadValueOptions<Required extends boolean = true, Default = undefined> {
    /**
     * Controls whether a missing property, `null`, or `undefined` fails validation.
     *
     * Defaults to `true`. With `primitivesFromString`, an empty number or boolean
     * string is also considered missing.
     */
    required?: Required;
    /**
     * Replaces a missing value when `required` is `false`.
     */
    default?: Default;
}
export interface PayloadDescriptorBase<Kind extends string, Required extends boolean = true, Default = undefined> {
    readonly __payloadDescriptor: true;
    readonly kind: Kind;
    readonly required: Required;
    readonly default: Default;
}
export interface PayloadStringDescriptor<Required extends boolean = true, Default extends string | null | undefined = undefined> extends PayloadDescriptorBase<"string", Required, Default> {
}
export interface PayloadNumberDescriptor<Required extends boolean = true, Default extends number | null | undefined = undefined> extends PayloadDescriptorBase<"number", Required, Default> {
}
export interface PayloadBooleanDescriptor<Required extends boolean = true, Default extends boolean | null | undefined = undefined> extends PayloadDescriptorBase<"boolean", Required, Default> {
}
export type PayloadObjectDefinition = PayloadDefinition | PayloadSchema<any, any>;
export interface PayloadObjectDescriptor<Definition extends PayloadObjectDefinition, Required extends boolean = true, Default = undefined> extends PayloadDescriptorBase<"object", Required, Default> {
    readonly definition: Definition;
}
export interface PayloadArrayDescriptor<Item extends PayloadValueDefinition, Required extends boolean = true, Default = undefined> extends PayloadDescriptorBase<"array", Required, Default> {
    readonly item: Item;
}
export type PayloadPrimitiveDescriptor = PayloadStringDescriptor<any, any> | PayloadNumberDescriptor<any, any> | PayloadBooleanDescriptor<any, any>;
export type PayloadDescriptor = PayloadPrimitiveDescriptor | PayloadObjectDescriptor<any, any, any> | PayloadArrayDescriptor<any, any, any>;
export type PayloadValueDefinition = PayloadDescriptor | PayloadParser<any, any> | PayloadSchema<any, any>;
/**
 * Maps output property names to their validation and transformation rules.
 *
 * Only declared properties are copied into parsed output. Each value may use a
 * descriptor, a nested schema, or a custom parser.
 */
export type PayloadDefinition = Record<string, PayloadValueDefinition>;
type PrimitivesFromString<Options extends PayloadSchemaOptions> = Options extends {
    primitivesFromString: true;
} ? true : false;
type ApplyRawOptions<Raw, Value extends PayloadValueDefinition> = Value extends PayloadDescriptorBase<any, false, any> ? Raw | null | "" : Raw;
type ApplyParsedOptions<Parsed, Value extends PayloadValueDefinition> = Value extends PayloadDescriptorBase<any, false, infer Default> ? Parsed | Default : Parsed;
type OptionalRawKeys<Definition extends PayloadDefinition> = {
    [Key in keyof Definition]-?: Definition[Key] extends PayloadDescriptorBase<any, false, any> ? Key : never;
}[keyof Definition];
type RequiredRawKeys<Definition extends PayloadDefinition> = Exclude<keyof Definition, OptionalRawKeys<Definition>>;
type InferRawObject<ObjectDefinition extends PayloadObjectDefinition, ParentOptions extends PayloadSchemaOptions> = ObjectDefinition extends PayloadSchema<infer Definition, infer Options> ? InferRawDefinition<Definition, Options> : ObjectDefinition extends PayloadDefinition ? InferRawDefinition<ObjectDefinition, ParentOptions> : never;
type InferParsedObject<ObjectDefinition extends PayloadObjectDefinition> = ObjectDefinition extends PayloadSchema<infer Definition, any> ? InferParsedDefinition<Definition> : ObjectDefinition extends PayloadDefinition ? InferParsedDefinition<ObjectDefinition> : never;
export type InferRawValue<Value extends PayloadValueDefinition, Options extends PayloadSchemaOptions> = Value extends PayloadSchema<infer Definition, infer SchemaOptions> ? InferRawDefinition<Definition, SchemaOptions> : Value extends PayloadParser<infer Raw, any> ? Raw : Value extends PayloadStringDescriptor<any, any> ? ApplyRawOptions<string, Value> : Value extends PayloadNumberDescriptor<any, any> ? ApplyRawOptions<PrimitivesFromString<Options> extends true ? string : number, Value> : Value extends PayloadBooleanDescriptor<any, any> ? ApplyRawOptions<PrimitivesFromString<Options> extends true ? string : boolean, Value> : Value extends PayloadObjectDescriptor<infer Definition, any, any> ? ApplyRawOptions<InferRawObject<Definition, Options>, Value> : Value extends PayloadArrayDescriptor<infer Item, any, any> ? ApplyRawOptions<InferRawValue<Item, Options>[], Value> : never;
export type InferParsedValue<Value extends PayloadValueDefinition> = Value extends PayloadSchema<infer Definition, any> ? InferParsedDefinition<Definition> : Value extends PayloadParser<any, infer Parsed> ? Parsed : Value extends PayloadStringDescriptor<any, any> ? ApplyParsedOptions<string, Value> : Value extends PayloadNumberDescriptor<any, any> ? ApplyParsedOptions<number, Value> : Value extends PayloadBooleanDescriptor<any, any> ? ApplyParsedOptions<boolean, Value> : Value extends PayloadObjectDescriptor<infer Definition, any, any> ? ApplyParsedOptions<InferParsedObject<Definition>, Value> : Value extends PayloadArrayDescriptor<infer Item, any, any> ? ApplyParsedOptions<InferParsedValue<Item>[], Value> : never;
/**
 * Infers the JSON shape before hydration and validation.
 *
 * The result reflects `primitivesFromString` and permits optional properties to
 * be absent or contain their supported missing values.
 */
export type InferRawDefinition<Definition extends PayloadDefinition, Options extends PayloadSchemaOptions> = {
    -readonly [Key in RequiredRawKeys<Definition>]: InferRawValue<Definition[Key], Options>;
} & {
    -readonly [Key in OptionalRawKeys<Definition>]?: InferRawValue<Definition[Key], Options>;
};
/**
 * Infers the application-facing shape after validation, conversion, custom
 * parsing, and default values have been applied.
 */
export type InferParsedDefinition<Definition extends PayloadDefinition> = {
    -readonly [Key in keyof Definition]: InferParsedValue<Definition[Key]>;
};
export {};
