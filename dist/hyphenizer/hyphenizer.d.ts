/**
 * Replaces text nodes with spans containing hyphenated words using <wbr>
 */
export declare function softHyphenizer(container: HTMLElement, language: any): void;
/**
 * Finalizes hyphenation by turning soft hyphens into real hyphens
 * *only* at the positions that result in line breaks.
 */
export declare function solidHyphens(container: HTMLElement): void;
/**
 * Determines whether a given word will break across lines when rendered
 * in the same visual context as the provided `Text` node.
 *
 * @param referenceNode The `Text` node whose styling and layout context should be used.
 * @param prefixText The text content that precedes the `word`, used to simulate real positioning.
 * @param word The word to test for line-breaking behavior (may contain soft hyphens).
 * @returns Boolean: true if the word breaks across lines, false otherwise.
 */
export declare function doesWordBreak(referenceNode: Text, prefixText: string, word: string): boolean;
type IndicesLineMap = Map<number, number[]>;
type StringsLineMap = Map<number, string>;
/**
 * Get each rendered line of `textNode` as a string.
 *
 * @param textNode A `Text` node in the DOM to get the lines from.
 * @param returnType "strings" returns each line as a string.
 * @returns A map of line index to line text.
 */
declare function getRenderedLineMap(textNode: Text, returnType: "strings"): StringsLineMap;
/**
 * Get each rendered line of `textNode` as character indices of its text content.
 *
 * @param textNode A `Text` node in the DOM to get the lines from.
 * @param returnType "indices" returns each line as an array of character indices.
 * These indices are global offsets within the `Text` node's text content.
 * @returns A map of line index to character indices.
 */
declare function getRenderedLineMap(textNode: Text, returnType: "indices"): IndicesLineMap;
export { getRenderedLineMap };
