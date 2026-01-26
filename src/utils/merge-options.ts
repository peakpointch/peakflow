import type { PartialDeep } from "type-fest";
import { merge } from "ts-deepmerge";

/**
 * Deeply merges user-provided options into a set of default options.
 *
 * This function is immutable and uses `ts-deepmerge` under the hood.
 * ---
 * @param defaults - The default options object providing base values.
 * @param options - A deep partial options object that can override
 * the defaults.
 * @returns A new object containing the deeply merged result of
 * defaults and options.
 */
export function mergeOptions<T, U extends PartialDeep<T>>(defaults: T, ...options: U[]): T {
  return merge(defaults, ...options) as T;
}

export default mergeOptions;
