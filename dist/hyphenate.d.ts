/**
 * Replaces text nodes with spans containing hyphenated words using <wbr>
 */
export declare function hyphenateDOM(container: HTMLElement): void;
/**
 * Converts soft hyphens in all `Text` nodes within the given `container` into real hyphens,
 * but only if they cause a line break.
 *
 * @param container Ancestor of all the `Text` nodes to convert
 */
export declare function finalizeHyphenation(container: HTMLElement): void;
