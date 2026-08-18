import { Path } from "../path/path.js";
import { Payload } from "./payload.js";
import type {
  GetPayloadOptions,
  InferParsedDefinition,
  InferRawDefinition,
  PayloadArrayDescriptor,
  PayloadBooleanDescriptor,
  PayloadDefinition,
  PayloadDescriptor,
  PayloadDescriptorBase,
  PayloadNumberDescriptor,
  PayloadObjectDescriptor,
  PayloadParseOptions,
  PayloadParser,
  PayloadPrimitiveDescriptor,
  PayloadSchemaOptions,
  PayloadValueDefinition,
  PayloadVariableResolvers,
} from "./types.js";

type MissingValue<Descriptor extends PayloadDescriptor> =
  Descriptor extends PayloadDescriptorBase<any, false, infer Default> ? Default : never;

/**
 * Reports a schema failure at the exact property or array item that failed.
 *
 * `path` locates the value within the payload. `cause` retains the original type
 * error or error thrown by a custom parser.
 */
export class PayloadValueError extends TypeError {
  public path: string;
  public constructor(path: Path, message: string, options?: ErrorOptions) {
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
export class PayloadSchema<
  const Definition extends PayloadDefinition,
  const Options extends PayloadSchemaOptions = {},
> {
  private readonly definition: Definition;
  private readonly options: Required<PayloadSchemaOptions>;
  private path: Path = new Path("");

  public constructor(definition: Definition, options?: Options) {
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
  public parse(
    embed: HTMLScriptElement,
    options: PayloadParseOptions = {},
  ): InferParsedDefinition<Definition> {
    const raw = this.parseRaw(embed);

    const resolvers: PayloadVariableResolvers = {
      dom: Payload.resolvers.dom(embed.parentElement),
      var: Payload.resolvers.object(options.variables ?? {}),
      ...options.resolvers,
    };

    const hydrated = Payload.hydrate(raw, resolvers);

    return this.parseDefinition(hydrated, this.definition) as InferParsedDefinition<Definition>;
  }

  /**
   * Applies the schema to a JavaScript value that has already been assembled.
   *
   * This skips JSON parsing and variable hydration. It is intended for callers
   * such as collection lists that inject nested data before schema validation.
   */
  public parseData(value: unknown): InferParsedDefinition<Definition> {
    return this.parseDefinition(value, this.definition) as InferParsedDefinition<Definition>;
  }

  /**
   * Reads the embed as the schema's inferred input type without applying the
   * schema.
   *
   * The inferred type is not runtime validation; malformed JSON shapes are only
   * rejected by `parse()`, `get()`, or `parseData()`.
   */
  public parseRaw(embed: HTMLScriptElement): InferRawDefinition<Definition, Options> {
    return Payload.parseRaw<InferRawDefinition<Definition, Options>>(embed);
  }

  /**
   * Finds an embed whose `data-payload-id` matches `id` and runs the full parsing
   * pipeline.
   *
   * The global document is searched unless `options.doc` provides a narrower
   * document or element root.
   */
  public get(
    id: string,
    options: Partial<GetPayloadOptions> = {},
  ): InferParsedDefinition<Definition> {
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
  public getRaw(
    id: string,
    options: Partial<GetPayloadOptions> = {},
  ): InferRawDefinition<Definition, Options> {
    const embed = this.getEmbed(id, options.doc ?? document);

    return this.parseRaw(embed);
  }

  /**
   * Owns path scoping for object properties.
   *
   * Each property starts from the parent path so nested parsing can append its
   * location without leaking that location into the next property.
   */
  private parseDefinition(value: unknown, definition: PayloadDefinition): Record<string, unknown> {
    this.assertObject(value);

    const parsed: Record<string, unknown> = {};

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
  private parseValue(value: unknown, definition: PayloadValueDefinition): unknown {
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
    } catch (error) {
      if (error instanceof PayloadValueError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new PayloadValueError(this.path, message, { cause: error });
    }
  }

  private parsePrimitive<T extends PayloadPrimitiveDescriptor>(
    value: unknown,
    descriptor: T,
  ): string | number | boolean | MissingValue<T> {
    switch (descriptor.kind) {
      case "string":
        return this.parseString(value);

      case "number":
        return this.parseNumber(value, descriptor);

      case "boolean":
        return this.parseBoolean(value, descriptor);
    }
  }

  private parseString(value: unknown): string {
    if (typeof value !== "string") {
      throw new TypeError(`Expected payload value to be a string, received ${typeof value}.`);
    }

    return value;
  }

  private parseNumber<T extends PayloadNumberDescriptor>(
    value: unknown,
    descriptor: T,
  ): number | MissingValue<T> {
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
      const hint =
        typeof value === "string" ? ` Did you forget to enable "primitivesFromString"?` : "";
      throw new TypeError(
        `Expected payload value to be a number, received ${typeof value}.${hint}`,
      );
    }

    return value;
  }

  private parseBoolean<T extends PayloadBooleanDescriptor>(
    value: unknown,
    descriptor: T,
  ): boolean | MissingValue<T> {
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
      const hint =
        typeof value === "string" ? ` Did you forget to enable "primitivesFromString"?` : "";
      throw new TypeError(
        `Expected payload value to be a boolean, received ${typeof value}.${hint}`,
      );
    }

    return value;
  }

  private parseObject(
    value: unknown,
    descriptor: PayloadObjectDescriptor<any, any, any>,
  ): Record<string, unknown> {
    if (descriptor.definition instanceof PayloadSchema) {
      return this.parseSchema(value, descriptor.definition);
    }
    return this.parseDefinition(value, descriptor.definition);
  }

  private parseArray(value: unknown, descriptor: PayloadArrayDescriptor<any, any, any>): unknown[] {
    this.assertArray(value);

    return value.map((item, index) =>
      this.path.withSnapshot((path) => {
        path.down(index);
        return this.parseValue(item, descriptor.item);
      }),
    );
  }

  /**
   * Temporarily prefixes a nested schema with its location in the parent payload.
   *
   * The nested schema restores its previous path afterward, allowing the same
   * schema instance to be reused at multiple properties without retaining state
   * from an earlier parse.
   */
  private parseSchema(value: unknown, schema: PayloadSchema<any, any>): Record<string, unknown> {
    return schema.path.withSnapshot(() => {
      schema.path.prefix(this.path.toString());
      return schema.parseDefinition(value, schema.definition);
    });
  }

  private parseCustom(value: unknown, parser: PayloadParser<any, any>): unknown {
    return parser(value);
  }

  private assertObject(value: unknown): asserts value is Record<string, unknown> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      throw new TypeError(`Expected payload value to be a plain object.`);
    }
  }

  private assertArray(value: unknown): asserts value is unknown[] {
    if (!Array.isArray(value)) {
      throw new TypeError(`Expected payload value to be an array.`);
    }
  }

  private parseMissingValue<T extends PayloadDescriptor>(descriptor: T): MissingValue<T> {
    if (descriptor.required) {
      throw new TypeError(`This value is required.`);
    }

    return descriptor.default;
  }

  private getEmbed(id: string, doc: Document | Element): HTMLScriptElement {
    const embed = Payload.select("embed", id, { doc }) as HTMLScriptElement | null;

    if (!embed) {
      throw new Error(`Failed to get payload: No payload embed found with id "${id}".`);
    }

    return embed;
  }
}
