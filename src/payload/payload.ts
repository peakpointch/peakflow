import { Selector, Dataset } from "../selector/";
import type { Attribute, Attributes } from "../selector";

export type PayloadElement = "embed" | "var";
export type PayloadData = Record<string, any> | Array<any>;
export type PayloadVariables = Record<string, string>;

export interface PayloadAttributes extends Attributes {
  id: Attribute<string, string>;
  element: Attribute<string, PayloadElement>;
  var: Attribute<string, string>;
}

export interface GetPayloadOptions {
  doc: Document | Element;
}

/**
 * A Singleton used for parsing JSON from the DOM.
 */
export class Payload {
  private static dataset = Dataset.define({
    id: Dataset.String("data-payload-id"),
    element: Dataset.String<PayloadElement>("data-payload-element"),
    var: Dataset.String("data-payload-var"),
  });

  private static instance: Payload;

  private constructor() {}

  public static getInstance(): Payload {
    if (!Payload.instance) {
      Payload.instance = new Payload();
    }
    return Payload.instance;
  }

  protected attributeSelector = Selector.attr<PayloadElement>(Payload.dataset.attr.element);
  public selector = Selector.instance<PayloadElement>(
    this.attributeSelector,
    Payload.dataset.attr,
    { root: "embed", scoped: false },
  );
  public select = Selector.select<PayloadElement>(this.selector);
  public selectAll = Selector.selectAll<PayloadElement>(this.selector);

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
  public get<T extends PayloadData>(id: string, options?: Partial<GetPayloadOptions>): T {
    const opts: GetPayloadOptions = {
      doc: options?.doc ?? document,
    };

    const embed = this.select<HTMLScriptElement>("embed", id, { doc: opts.doc });
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
  public parse<T extends PayloadData>(embed: HTMLScriptElement, variables?: PayloadVariables): T {
    const data = this.parseRaw<T>(embed);
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
  public parseRaw<T extends PayloadData>(embed: HTMLScriptElement): T {
    if (!(embed instanceof HTMLScriptElement) || embed.type !== "application/json") {
      throw new Error(`Failed to parse payload: Invalid payload embed element.`);
    }

    let data: T;
    const raw = embed.textContent.trim() || "{}";

    try {
      data = JSON.parse(raw) as T;
    } catch (err) {
      throw new Error(`Failed to parse payload: ${raw}\n\n${err.message}`);
    }

    return data;
  }

  public parseVariables<T extends PayloadVariables>(doc: Document | Element): T {
    const fields = this.selectAll("var", undefined, { doc: doc });
    const variables: PayloadVariables = {};

    fields.forEach((el) => {
      const dataset = Payload.dataset.parse(el);
      if (dataset.var) {
        variables[dataset.var] = el.innerHTML;
      }
    });

    return variables as T;
  }

  public hydrate<T extends PayloadData>(payload: T, variables: PayloadVariables): T {
    if (payload === null || typeof payload !== "object") {
      return payload;
    }

    if (Array.isArray(payload)) {
      return payload.map((item) => this.hydrate(item, variables)) as unknown as T;
    }

    for (const key in payload) {
      const val = payload[key];
      if (val === null) continue;
      switch (typeof val) {
        case "object":
          payload[key] = this.hydrate(val, variables);
          break;
        case "string":
          payload[key] = this.hydrateValue(val, variables) as any;
          break;
      }
    }

    return payload;
  }

  public hydrateValue(value: string, variables: PayloadVariables): string {
    const variableSyntax = /\$\{([^}]+)\}/g;
    const missingVars = [];

    const hydrated = value.replace(variableSyntax, (match, varName) => {
      if (varName in variables) {
        return variables[varName];
      } else {
        missingVars.push(varName);
        return match;
      }
    });

    if (missingVars.length) {
      console.warn(
        `Payload: Found ${missingVars.length} missing variables (${missingVars.join(", ")}) in the following value:\n`,
        hydrated,
      );
    }

    return hydrated;
  }
}

export const payload = Payload.getInstance();
