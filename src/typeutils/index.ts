/// <reference types="../../types/utils.d.ts" />

export type CamelToDash<T extends string> = T extends `${infer Head}${infer Tail}`
  ? Head extends Lowercase<Head> // First character is lowercase
    ? `${Head}${CamelToDash<Tail>}` // If it is lowercase, continue as normal
    : `-${Lowercase<Head>}${CamelToDash<Tail>}` // If it's uppercase, add a dash and make it lowercase
  : T;

export type DashToCamelCase<T extends string> = T extends `${infer Head}-${infer Tail}`
  ? `${Head}${Capitalize<DashToCamelCase<Tail>>}` // Capitalize the first character of Tail
  : T;

export type CamelToPascal<T extends string> = T extends `${infer Head}${infer Tail}`
  ? `${Uppercase<Head>}${Tail}`
  : T;

export type PascalToCamel<T extends string> = T extends `${infer Head}${infer Tail}`
  ? `${Lowercase<Head>}${Tail}`
  : T;

export type DashToPascal<T extends string> = Capitalize<DashToCamelCase<T>>;

export type PascalToDash<T extends string> = CamelToDash<PascalToCamel<T>>;

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

export type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export type Expect<T extends true> = T;

/**
 * Recursively makes properties of option objects optional.
 *
 * Functions, arrays, DOM nodes, and class instances are treated as atomic
 * values and are not recursively made partial.
 */
export type PartialOptions<T> = T extends (...args: any[]) => any
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends Node
      ? T
      : T extends { constructor: new (...args: any[]) => any }
        ? T
        : T extends object
          ? { [K in keyof T]?: PartialOptions<T[K]> }
          : T;
