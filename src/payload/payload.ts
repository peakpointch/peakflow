import { Selector, Dataset } from "../selector/";
import type { Attribute, Attributes } from "../selector";

export type PayloadElement = "embed";
export type PayloadData = Record<string, any> | Array<any>;

export interface PayloadAttributes extends Attributes {
  id: Attribute<string, string>;
  element: Attribute<string, PayloadElement>;
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
  public parse<T extends PayloadData>(embed: HTMLScriptElement): T {
    if (!(embed instanceof HTMLScriptElement) || embed.type !== "application/json") {
      throw new Error(`Failed to parse payload: Invalid payload embed element.`);
    }

    let payload: T;

    try {
      payload = JSON.parse(embed.textContent) as T;
    } catch (err) {
      throw new Error(`Failed to parse payload: ${err.message}`);
    }

    return payload;
  }
}

export const payload = Payload.getInstance();
