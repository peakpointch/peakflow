import type { Attributes, Attribute } from "./attributes";

type AttributeMatchType =
  | "startsWith" // ^=
  | "endsWith" // $=
  | "includes" // *=
  | "whitespace" // ~=
  | "hyphen" // |=
  | "exact"; // =
type AttributeMatchOperator = "^" | "$" | "*" | "~" | "|" | "";
type AttributeMatchTypeMap = {
  [key in AttributeMatchType]: AttributeMatchOperator;
};
export type AttributeSelector<T = string> = (
  name?: T,
  options?: Partial<AttributeOptions>,
) => string;

export type InstanceSelector<T = string> = (element: T, instance?: string) => string;

export interface BaseAttributes extends Attributes {
  id: Attribute;
  element: Attribute;
}

export interface AttributeDefaultOptions<T extends string> {
  defaultMatchType: AttributeMatchType;
  defaultValue: T | undefined;
  defaultExclusions: string[];
}

export interface AttributeOptions {
  matchType: AttributeMatchType;
  exclusions: string[];
}

export interface InstanceDefaultOptions<T extends string> {
  /**
   * Defines which element string represents the component's root.
   * @default "component"
   */
  root?: T;

  /**
   * If true, elements are searched for inside the instance container.
   * If false, all elements must have an instance ID.
   * @default true
   */
  scoped?: boolean;
}

export interface SelectOptions {
  doc: Document | Element;
}

const attrMatchTypes: AttributeMatchTypeMap = {
  startsWith: "^",
  endsWith: "$",
  includes: "*",
  whitespace: "~",
  hyphen: "|",
  exact: "",
};

/**
 * Converts a human-friendly `AttributeType` to a CSS `AttributeOperator`.
 */
function getOperator(type: AttributeMatchType): AttributeMatchOperator {
  return attrMatchTypes[type] || "";
}

/**
 * Excludes a CSS selector from a CSS selector.
 *
 * @param selector The original selector that should exclude specific elements.
 * @param exclusions The selectors to exclude from the original selector.
 * @returns A CSS selector.
 */
export function exclude(selector: string, ...exclusions: string[]): string {
  if (exclusions.length === 0) return selector;

  return `:is(${selector}):not(${exclusions.join(", ")})`;
}

export function extend(selector: string, ...extensions: string[]): string {
  if (extensions.length === 0) return selector;
  return `:is(${selector})${extensions.join("")}`;
}

export function append(selectorList: string[], suffix: string): string {
  return selectorList.reduce((acc, string) => {
    const prefix = acc === "" ? "" : `${acc}, `;
    return `${prefix}${string}${suffix}`;
  }, "");
}

export function split(selector: string): string[] {
  const result: string[] = [];
  let current = "";
  let depth = 0;
  let i = 0;

  while (i < selector.length) {
    const char = selector[i];

    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
    }

    if (char === "," && depth === 0) {
      result.push(current.trim());
      current = "";
      i++; // skip comma
      while (selector[i] === " ") i++; // skip all spaces after comma
      continue;
    }

    current += char;
    i++;
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

type Getter<T> = (this: any) => T;

export class Selector {
  /**
   * Creates a selector function based on the provided attribute name.
   * The returned selector function can be used to generate a string selector for the given name.
   * If no name is provided, it will return a selector with just the attribute name.
   *
   * @template T - The type of the name that will be passed to the generated selector function (e.g., string).
   * @param attrName - The name of the attribute that will be used in the selector.
   * @param defaultOptions - Options to configure selector generation.
   * @returns A function that generates the selector string based on the provided name and match type.
   */
  public static attr<T extends string = string>(
    attrName: string | Getter<string>,
    defaultOptions?: Partial<AttributeDefaultOptions<T>>,
  ): AttributeSelector<T> {
    const mergedDefaultOptions: AttributeDefaultOptions<T> = {
      defaultMatchType: defaultOptions?.defaultMatchType ?? "exact",
      defaultValue: defaultOptions?.defaultValue ?? undefined,
      defaultExclusions: defaultOptions?.defaultExclusions ?? [],
    };

    return function (
      this: unknown,
      name: T | undefined = mergedDefaultOptions.defaultValue,
      options?: Partial<AttributeOptions>,
    ): string {
      const resolved = typeof attrName === "function" ? attrName.call(this) : attrName;
      const mergedOptions: AttributeOptions = {
        matchType: options?.matchType ?? mergedDefaultOptions.defaultMatchType,
        exclusions: options?.exclusions ?? mergedDefaultOptions.defaultExclusions,
      };

      if (!name) {
        return exclude(`[${resolved}]`, ...mergedOptions.exclusions);
      }

      const value = String(name); // Ensure it's a string for selector use
      const selector = `[${resolved}${getOperator(mergedOptions.matchType)}="${value}"]`;

      return exclude(selector, ...(mergedOptions.exclusions ?? []));
    };
  }

  /**
   * Creates an instance specific selector function for a `BaseComponent` class.
   *
   * @template T - The union of all allowed element names for a component.
   * @param attributeSelector - The attributeSelector member of the component class.
   * @param attr - The attr member of component class.
   * @returns A typed static member that generates an instance specific selector string.
   */
  public static instance<T extends string>(
    attributeSelector: AttributeSelector<T>,
    attr: BaseAttributes | Getter<BaseAttributes>,
    options?: InstanceDefaultOptions<T>,
  ): InstanceSelector<T> {
    const { root = "component", scoped = true } = options ?? {};

    return function (this: unknown, element: T, instance?: string) {
      const resolved = typeof attr === "function" ? attr.call(this) : attr;
      const base = attributeSelector.call(this, element);
      const instanceSelector = instance ? `[${resolved.id}="${instance}"]` : "";

      // Avoid duplicate selectors when no instance selector was given
      if (!instanceSelector) return base;

      // Id attribute must be defined on component element directly
      // Allow scoping for normal elements
      return element === root || !scoped
        ? `${base}${instanceSelector}`
        : `${base}${instanceSelector}, ${instanceSelector} ${base}`;
    };
  }

  public static select<T extends string>(instanceSelector: InstanceSelector<T>) {
    return function <U extends Element = HTMLElement>(
      this: unknown,
      element: T,
      instance?: string,
      options?: SelectOptions,
    ): U | null {
      return (options?.doc ?? document).querySelector<U>(
        instanceSelector.call(this, element, instance),
      );
    };
  }

  public static selectAll<T extends string>(instanceSelector: InstanceSelector<T>) {
    return function <U extends Element = HTMLElement>(
      this: unknown,
      element: T,
      instance?: string,
      options?: SelectOptions,
    ): NodeListOf<U> {
      return (options?.doc ?? document).querySelectorAll<U>(
        instanceSelector.call(this, element, instance),
      );
    };
  }
}
