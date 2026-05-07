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
export declare class Payload {
    private static dataset;
    private static instance;
    private constructor();
    static getInstance(): Payload;
    protected attributeSelector: import("../selector/selector").AttributeSelector<"embed">;
    selector: import("../selector/selector").InstanceSelector<"embed">;
    select: <U extends Element = HTMLElement>(element: "embed", instance?: string, options?: import("../selector/selector").SelectOptions) => U;
    selectAll: <U extends Element = HTMLElement>(element: "embed", instance?: string, options?: import("../selector/selector").SelectOptions) => NodeListOf<U>;
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
    get<T extends PayloadData>(id: string, options?: Partial<GetPayloadOptions>): T;
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
    parse<T extends PayloadData>(embed: HTMLScriptElement): T;
}
export declare const payload: Payload;
