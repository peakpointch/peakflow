import { RenderBlockBase } from "./blocks/index.js";
import { RenderFieldBase } from "./fields/index.js";
import type { DashToCamelCase } from "../typeutils/index.js";
import type { IANATimeZone } from "../timezones/index.js";

export type { RenderFieldType } from "./fields/index.js";

export type RenderField<F extends FilterAttributes<keyof F & string> = {}> = RenderFieldBase<F>;
export type RenderBlock<F extends FilterAttributes<keyof F & string> = {}> = RenderBlockBase<F>;
export type RenderNode<F extends FilterAttributes = {}> = RenderField<F> | RenderBlock<F>;
export type RenderData<F extends FilterAttributes = {}> = RenderNode<F>[];

export interface MissingNodeWarning {
  path: string;
  message: string;
  node: RenderNode;
}

export interface RendererWarnings {
  missingBlocks: MissingNodeWarning[];
  missingFields: MissingNodeWarning[];
}

export interface RenderAttributes {
  block: string;
  field: string;
  emptyState: string;
  collection: string;
  decorative: string;
  hideAncestor: string;
  inheritVisibility: string;
  visibilityControl: string;
  invisible: string;
  clear: string;
}

/**
 * Tells the `Renderer` how to handle the visibility of a rendered element
 * in case all its children are empty.
 */
export type VisibilityControl = "emptyState" | "hideSelf" | "hideAncestor" | "none";

/**
 * Defines the type of a `FilterAttribute`.
 */
export type FilterAttributeType = {
  string: string;
  number: number;
  boolean: boolean;
  date: Date;
};

export type FilterAttributes<T extends string = string> = {
  [K in T]: keyof FilterAttributeType;
};

export type PropsFromFilterAttributes<F extends FilterAttributes> = {
  [K in keyof F as DashToCamelCase<K & string>]?: FilterAttributeType[F[K]];
};

/**
 * Defines the options of a `Renderer` instance.
 */
export interface RendererOptions<F extends FilterAttributes<keyof F & string> = {}> {
  /**
   * The base attribute used to identify render nodes in the DOM.
   *
   * @example
   * "render" will look for elements like:
   *   <div data-render-element="example" />.
   */
  attributeName: string;

  /**
   * Defines which HTML attributes should be read as typed values on `props`
   * of `RenderField` and `RenderBlock`. Keys must be in dash-case and will
   * be converted to camelCase. Values indicate the expected type.
   * ÔÇô
   * @example
   * { "start-date": "date" } maps to props: { startDate: Date }
   * For: <div data-render-element="event" start-date="2024-01-01" />
   */
  filterAttributes: F;

  /**
   * The IANA timezone name used when parsing dates from the DOM.
   *
   * This is important if the DOM values are in a fixed timezone
   * (e.g., "Europe/Zurich") while your JavaScript runtime may use another.
   *
   * Set to `false` to disable timezone handling and treat dates as-is.
   *
   * @example
   * timezone: "Europe/Zurich"
   */
  timezone?: false | IANATimeZone;

  pathPrefix?: string;

  /**
   * Fallback options for `RenderNode`s when no options are set on the
   * HTMLRenderNode.
   */
  defaults: {
    visibilityControl: VisibilityControl;
    /** Whether to clear the value of a `RenderField`. */
    clear: boolean;
  };

  warnings: {
    /**
     * If true, warnings are automatically cleared before each render
     * and logged after each render.
     */
    autolog: boolean;

    /**
     * Allows you omit any warning.
     */
    omit: {
      [K in keyof RendererWarnings]: boolean;
    };
  };
}
