import type { RenderData, FilterAttributes, PropsFromFilterAttributes } from "../types.js";

/**
 * A `RenderBlock` can wrap multiple `RenderNode`s (fields or blocks).
 * It is helpful when grouping data together in an object oriented way.
 */
export default class RenderBlockBase<F extends FilterAttributes<keyof F & string> = {}> {
  /**
   * The name of this `RenderBlock`.
   *
   * This property is often used as a type identifier, which specifies the type
   * of content this block holds, for example `"dish"`, `"day"`, or `"event"`.
   *
   * It is used by the `Renderer` to map the block to the corresponding DOM
   * elements and child nodes.
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
   * The children as `RenderData` this `RenderBlock` groups together
   */
  children: RenderData<F>;

  /**
   * Whether this `RenderBlock` should be visible when it's rendered.
   */
  visibility: boolean;

  /**
   * Marks this `RenderBlock` as decorative.
   *
   * Decorative blocks are ignored when determining whether their parent node
   * should be hidden. In other words, even if a decorative block's children do have
   * values, it does not prevent the parent node from being considered empty.
   */
  decorative?: boolean;

  /**
   * Additional properties for this `RenderBlock`.
   *
   * Can be used to filter, sort, or otherwise categorize `RenderNode`s based on
   * custom metadata.
   */
  props?: PropsFromFilterAttributes<F>;
}

export { RenderBlockBase };
