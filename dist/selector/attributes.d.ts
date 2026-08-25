import type { IsUnknown } from "type-fest";
export type Attribute<N extends string = string, T = string> = N | DatasetAttribute<N, T>;
export type DatasetAttribute<N extends string = string, T = unknown> = {
    name: N;
    type: AttributeType<T>;
    default?: T;
};
export type Attributes<T extends string = string, K extends string = string> = {
    [U in T]: Attribute<K, any>;
};
export type DatasetAttributes<T extends Attributes = Attributes> = {
    [K in keyof T]: T[K] extends Attribute<infer N, infer U> ? IsUnknown<U> extends false ? DatasetAttribute<N, U> : DatasetAttribute<N, string> : never;
};
export type AttributeType<T = string> = (val: string | null | undefined, attr: DatasetAttribute<string, T>) => T;
export type ParsedAttributes<T extends Attributes> = {
    [K in keyof T]: ParsedAttribute<T[K]>;
};
export type ParsedAttribute<T extends Attribute> = T extends DatasetAttribute ? undefined extends T["default"] ? IsUnknown<T> extends false ? ParsedAttributeValue<T> : string : NonNullable<ParsedAttributeValue<T>> : never;
export type ParsedAttributeValue<T extends DatasetAttribute> = T["type"] extends AttributeType<infer U> ? U : never;
export type AttributeAccessorMap<T extends Attributes = Attributes> = {
    [K in keyof T]: T[K] extends Attribute<infer N, infer _> ? N : never;
};
type IsAny<T> = boolean extends (T extends never ? true : false) ? true : false;
type ResolveString<T> = IsAny<T> extends true ? string : [T] extends [never] ? string : T;
export declare class Dataset<T extends Attributes> {
    attr: AttributeAccessorMap<T>;
    definition: DatasetAttributes<T>;
    private constructor();
    static define<T extends Attributes<keyof T & string>>(attributes: T): Dataset<T>;
    static defineAttribute<N extends string>(attr: N): DatasetAttribute<N, string>;
    static defineAttribute<N extends string, T>(attr: Attribute<N, T>): DatasetAttribute<N, T>;
    static parse<T extends Attributes>(element: Element, attributes: DatasetAttributes<T>): ParsedAttributes<T>;
    parse(element: Element): ParsedAttributes<T>;
    static getAttribute(element: Element, attr: string): string;
    static getAttribute<T>(element: Element, attr: Attribute<string, T>): T;
    static String<T extends string = never, N extends string = string>(name: N, defaultValue?: T): DatasetAttribute<N, ResolveString<T>>;
    static Boolean<N extends string>(name: N, defaultValue?: boolean): DatasetAttribute<N, boolean>;
    static Number<N extends string>(name: N, defaultValue?: number): DatasetAttribute<N, number>;
    static NumberOrAuto<N extends string>(name: N, defaultValue?: number | "auto"): DatasetAttribute<N, number | "auto">;
}
export declare class Attr {
    static define<T extends Attributes>(attributes: T): AttributeAccessorMap<T>;
}
export {};
