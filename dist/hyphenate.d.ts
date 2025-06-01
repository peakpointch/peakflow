/**
 * Converts soft hyphens in all `Text` nodes within the given `container` into real hyphens,
 * but only if they cause a line break.
 *
 * @param container Ancestor of all the `Text` nodes to convert
 */
export declare function finalizeHyphenation(container: HTMLElement): void;
/**
 * Hyphenation finalizer with binary search per word.
 * Converts soft hyphens that cause a line break into real hyphens.
 */
export declare function finalizeHyphenationBinarySearch(container: HTMLElement): void;
