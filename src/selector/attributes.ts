import type { IsUnknown } from "type-fest";

// ==========================
// ====== Attribute(s) ======
// ==========================

export type Attribute<N extends string = string, T = string> = N | DatasetAttribute<N, T>;

export type DatasetAttribute<N extends string = string, T = unknown> = {
  name: N;
  type: AttributeType<T>;
  default?: T;
};

export type Attributes<T extends string = string, K extends string = string> = {
  [U in T]: Attribute<K, unknown>;
};

export type DatasetAttributes<T extends Attributes = Attributes> = {
  [K in keyof T]: T[K] extends Attribute<infer N, infer U>
    ? IsUnknown<U> extends false
      ? DatasetAttribute<N, U>
      : DatasetAttribute<N, string>
    : never;
};

export type AttributeType<T = string> = (
  val: string | null | undefined,
  attr: DatasetAttribute<string, T>,
) => T;

// ====================
// ====== Parsed ======
// ====================

export type ParsedAttributes<T extends DatasetAttributes> = {
  [K in keyof T]: ParsedAttribute<T[K]>;
};

export type ParsedAttribute<T extends DatasetAttribute> = undefined extends T["default"]
  ? IsUnknown<T> extends false
    ? ParsedAttributeValue<T>
    : string
  : NonNullable<ParsedAttributeValue<T>>;

export type ParsedAttributeValue<T extends DatasetAttribute> =
  T["type"] extends AttributeType<infer U> ? U : never;

export type AttributeAccessorMap<T extends Attributes = Attributes> = {
  [K in keyof T]: T[K] extends Attribute<infer N, infer _> ? N : never;
};

// =============================
// ====== Implementations ======
// =============================

export class Dataset<T extends Attributes> {
  public attr: AttributeAccessorMap<T>;
  public definition: DatasetAttributes<T>;

  // ============================
  // ====== Initialization ======
  // ============================

  private constructor(attributes: DatasetAttributes<T>) {
    this.attr = Attr.define(attributes as any as T);
    this.definition = attributes;
  }

  public static define<T extends Attributes<keyof T & string>>(attributes: T): Dataset<T> {
    const definition = Object.entries(attributes).reduce(
      (acc, [key, val]: [string, Attribute<string, unknown>]) => {
        acc[key] = {
          accessor: key,
          ...Dataset.defineAttribute(val),
        };

        return acc;
      },
      {} as DatasetAttributes<T>,
    );

    return new Dataset(definition);
  }

  public static defineAttribute<N extends string>(attr: N): DatasetAttribute<N, string>;
  public static defineAttribute<N extends string, T>(attr: Attribute<N, T>): DatasetAttribute<N, T>;
  public static defineAttribute(attr: Attribute): DatasetAttribute {
    let result: DatasetAttribute;

    if (typeof attr === "string") {
      result = {
        name: attr,
        type: Dataset.String(attr).type,
      };
    } else {
      result = {
        name: attr.name,
        type: attr.type || Dataset.String(attr.name).type,
        default: attr.default,
      };
    }

    return result;
  }

  // ===========================
  // ====== Parsing Logic ======
  // ===========================

  public static parse<T extends DatasetAttributes<any>>(
    element: Element,
    attributes: T,
  ): ParsedAttributes<T> {
    const attrArray = Object.entries(attributes);
    return attrArray.reduce((acc, [key, attr]) => {
      return {
        ...acc,
        [key]: attr.type(element.getAttribute(attr.name), attr) ?? attr.default,
      };
    }, {} as ParsedAttributes<T>);
  }

  public parse(element: Element): ParsedAttributes<DatasetAttributes<T>> {
    return Dataset.parse(element, this.definition);
  }

  public static getAttribute(element: Element, attr: string): string;
  public static getAttribute<T>(element: Element, attr: Attribute<string, T>): T;
  public static getAttribute<T>(element: Element, attr: Attribute<string, T>): T {
    const def = this.defineAttribute(attr);
    return def.type(element.getAttribute(def.name), def) ?? def.default;
  }

  // =============================
  // ====== Attribute Types ======
  // =============================

  static String<T extends string, N extends string = string>(
    name: N,
    defaultValue?: T,
  ): DatasetAttribute<N, T> {
    return {
      name,
      default: defaultValue,
      type: (val, attr) => (val ?? attr.default ?? "") as T,
    };
  }

  static Boolean<N extends string>(name: N, defaultValue?: boolean): DatasetAttribute<N, boolean> {
    return {
      name,
      default: defaultValue,
      type: (val, attr) => {
        if (val === null) return attr.default;
        if (val !== "true" && val !== "false") {
          throw new Error(`Attribute "${attr.name}" is not boolean`);
        }
        return val === "true";
      },
    };
  }

  static Number<N extends string>(name: N, defaultValue?: number): DatasetAttribute<N, number> {
    return {
      name,
      default: defaultValue,
      type: (val, attr) => {
        const n = Number(val);
        return !isNaN(n) ? n : attr.default;
      },
    };
  }

  static NumberOrAuto<N extends string>(
    name: N,
    defaultValue?: number | "auto",
  ): DatasetAttribute<N, number | "auto"> {
    return {
      name,
      default: defaultValue,
      type: (val, attr) => {
        return val === "auto" ? "auto" : val !== null ? parseFloat(val) : attr.default;
      },
    };
  }
}

export class Attr {
  public static define<T extends Attributes>(attributes: T): AttributeAccessorMap<T> {
    const attr = Object.entries(attributes).reduce((acc, [key, attr]) => {
      return {
        ...acc,
        [key]: typeof attr === "string" ? attr : attr.name,
      };
    }, {} as AttributeAccessorMap<T>);

    return attr;
  }
}
