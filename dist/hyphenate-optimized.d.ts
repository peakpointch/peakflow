/**
 * Finalizes hyphenation by turning soft hyphens into real hyphens
 * *only* at the positions that result in line breaks.
 */
export declare function finalizeHyphenationUsingLineMap(container: HTMLElement): void;
export declare function doesWordBreak(referenceNode: Text, prefixText: string, word: string): boolean;
