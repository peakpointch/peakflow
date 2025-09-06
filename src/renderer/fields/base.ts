import type { FilterAttributes, PropsFromFilterAttributes } from "../types.js";

export type RenderFieldType = "text" | "html" | "date" | "image";
export { RenderFieldBase };

/**
 * A `RenderField` ...
 */
export default class RenderFieldBase<F extends FilterAttributes<keyof F & string> = {}> {
  /**
   * The name of this `RenderField`.
   *
   * This defines what kind of data this field represents, for example
   * `"title"`, `"price"`, or `"description"`.
   *
   * While it can be human-readable, its main purpose is to tell the `Renderer`
   * how to interpret and map this field.
   */
  name: string;

  /**
   * An optional instance identifier for differentiating between multiple
   * nodes with the same `name` within the same parent.
   *
   * While `name` defines the type of node (e.g., "dish", "title"),
   * `instance` uniquely identifies one occurrence of that type.
   *
   * This is useful when a parent contains repeated blocks or fields
   * of the same type and you need to distinguish or target them individually.
   *
   * @example
   * { name: "dish", instance: "1" }
   * { name: "dish", instance: "2" }
   */
  instance?: string;

  /**
   * The value of this field as a string.
   * The format or interpretation of this value depends on the `type` property.
   */
  value: string;

  /**
   * The type of this field.
   *
   * This tells the Renderer how to render the `value`
   */
  type?: RenderFieldType;

  /**
   * Whether this `RenderField` should be visible when it's rendered.
   */
  visibility: boolean;

  /**
   * Marks this `RenderField` as decorative.
   *
   * Decorative fields are ignored when determining whether their parent node
   * should be hidden. In other words, even if a decorative field has a value,
   * it does not prevent the parent node from being considered empty.
   */
  decorative?: boolean;

  /**
   * Additional properties for this `RenderField`.
   *
   * Can be used to filter, sort, or otherwise categorize `RenderNode`s based on
   * custom metadata.
   */
  props?: PropsFromFilterAttributes<F>;
}
