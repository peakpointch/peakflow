/**
 * Utility to convert an Enum into a strictly typed interface
 * where keys map to their literal string values.
 */
export type EnumToInterface<T> = {
  [K in keyof T]: T[K];
};

/**
 * Utility to convert an Enum into a strictly typed string union
 */
export type EnumToUnion<T> = `${T}`;
