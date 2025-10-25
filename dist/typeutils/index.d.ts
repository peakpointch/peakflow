export type CamelToDash<T extends string> = T extends `${infer Head}${infer Tail}` ? Head extends Lowercase<Head> ? `${Head}${CamelToDash<Tail>}` : `-${Lowercase<Head>}${CamelToDash<Tail>}` : T;
export type DashToCamelCase<T extends string> = T extends `${infer Head}-${infer Tail}` ? `${Head}${Capitalize<DashToCamelCase<Tail>>}` : T;
/**
 * Make all properties in T optional, except those of type K
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;
/**
 * Boolean values as a string.
 */
export type BooleanString = "true" | "false";
/**
 * Replace `true` and `false` values with their string versions.
 */
export type StringifyBoolean<T> = Exclude<T, boolean> | BooleanString;
export type StringTypeMap = {
    string: string;
    boolean: boolean;
    number: number;
    numberOrAuto: number | "auto";
};
