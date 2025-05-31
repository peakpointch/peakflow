/**
 * Finalizes hyphenation by turning soft hyphens into real hyphens
 * *only* at the positions that result in line breaks.
 */
export function finalizeHyphenationUsingLineMap(container: HTMLElement) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node.nodeValue && node.nodeValue.includes('\u00AD')) {
      textNodes.push(node);
    }
  }

  for (const textNode of textNodes) {
    const parent = textNode.parentElement;
    if (!parent) continue;

    let stringLineMap = getRenderedLineMap(textNode, 'strings');
    const didNodeBreak = stringLineMap.size > 1;
    if (!didNodeBreak) {
      textNode.textContent = textNode.textContent.replace(/\u00AD/g, '');
      continue;
    }

    const newLines: StringsLineMap = new Map<number, string>();

    for (const [lineIndex, lineText] of stringLineMap.entries()) {
      let newLineText = lineText;
      const lastIndex = lineText.length - 1;
      const possibleSoftHyphen = lineText[lastIndex];

      if (possibleSoftHyphen === '\u00AD') {
        let testLine = lineText;

        let lastWord = getLastWord(testLine);
        lastWord = replaceCharAt(lastWord, lastWord.length - 1, '-');
        const firstWord = getFirstWordOfLine(stringLineMap, lineIndex + 1);

        let currLineWithoutLastWord = testLine.slice(0, testLine.length - lastWord.length);
        const didWordBreak = doesWordBreak(textNode, currLineWithoutLastWord, lastWord + firstWord);

        if (didWordBreak) {
          newLineText = replaceCharAt(lineText, lastIndex, '-');
        }
      }

      // Remove all soft hyphens
      newLineText = newLineText.replace(/\u00AD/g, '');

      newLines.set(lineIndex, newLineText);
    }

    const finalText = Array.from(newLines.values()).join('');
    const newNode = document.createTextNode(finalText);
    parent.replaceChild(newNode, textNode);
  }
}

function getFirstWordOfLine(lineMap: StringsLineMap, lineIndex: number): string {
  const line = lineMap.get(lineIndex) ?? '';
  return getFirstWord(line);
}

function getLastWordOfLine(lineMap: StringsLineMap, lineIndex: number): string {
  const line = lineMap.get(lineIndex) ?? '';
  return getLastWord(line);
}

function getFirstWord(str: string): string {
  const words = str.split(/[\s\-\u2013\u2014]+/).filter(Boolean);
  return words[0] ?? '';
}

function getLastWord(str: string): string {
  const words = str.split(/[\s\-\u2013\u2014]+/).filter(Boolean);
  return words[words.length - 1] ?? '';
}

/**
 * Replace a character at an `index` inside a string.
 *
 * @param str The string to modify
 * @param index The index of the character to replace
 * @param replacement The string to replace the character with
 */
function replaceCharAt(str: string, index: number, replacement: string): string {
  if (index < 0 || index >= str.length) {
    throw new RangeError('Index out of bounds');
  }
  return str.slice(0, index) + replacement + str.slice(index + 1);
}

/**
 * Gets indices of soft hyphens in a string.
 */
function getSoftHyphenIndices(word: string): number[] {
  const indices: number[] = [];
  for (let i = 0; i < word.length; i++) {
    if (word[i] === '\u00AD') indices.push(i);
  }
  return indices;
}

function findLineForCharIndex(index: number, lineMap: Map<number, number[]>): number | null {
  for (const [line, indices] of lineMap.entries()) {
    if (indices.includes(index)) return line;
  }
  return null;
}

export function doesWordBreak(referenceNode: Text, prefixText: string, word: string): boolean {
  const parent = referenceNode.parentElement;
  if (!parent) return false;

  const superParent = parent.parentElement;
  if (!superParent) throw new Error("Super parent is not defined.");

  // Clone the parent node
  const clone = parent.cloneNode(false) as HTMLElement;
  clone.style.whiteSpace = 'pre-wrap';

  // Compose the test text
  const base = document.createElement('span');
  base.textContent = prefixText;
  clone.appendChild(base);

  const testText = document.createTextNode(word);
  const span = document.createElement('span');
  span.appendChild(testText);
  clone.appendChild(span);

  // Insert clone
  parent.style.display = 'none';
  parent.insertAdjacentElement('beforebegin', clone);

  const lineMap = getRenderedLineMap(testText, 'strings');

  const breaks = lineMap.size > 1;

  superParent.removeChild(clone);
  parent.style.removeProperty('display');

  return breaks;
}

type LineMapReturnType = 'indices' | 'strings';
type IndicesLineMap = Map<number, number[]>;
type StringsLineMap = Map<number, string>;
type LineMap = IndicesLineMap | StringsLineMap;

/**
 * Get each rendered line of `textNode` as a string.
 *
 * @param textNode A `Text` node in the DOM to get the lines from.
 * @param returnType "strings" returns each line as a string.
 * @returns A map of line index to line text.
 */
function getRenderedLineMap(textNode: Text, returnType: 'strings'): StringsLineMap;

/**
 * Get each rendered line of `textNode` as character indices of its text content.
 *
 * @param textNode A `Text` node in the DOM to get the lines from.
 * @param returnType "indices" returns each line as an array of character indices.
 * These indices are global offsets within the `Text` node's text content.
 * @returns A map of line index to character indices.
 */
function getRenderedLineMap(textNode: Text, returnType: 'indices'): IndicesLineMap;

/**
 * Get each rendered line of `textNode`.
 *
 * @param textNode A `Text` node in the DOM to get the lines from.
 * @param returnType Determines the return format:
 * - "indices": returns each line as an array of character indices.
 * - "strings": returns each line as a string.
 */
function getRenderedLineMap(
  textNode: Text,
  returnType: LineMapReturnType
): LineMap {
  const range = document.createRange();
  const content = textNode.textContent || '';
  const parent = textNode.parentElement;
  if (!parent) throw new Error('Text node must be in DOM.');

  const lineMap = returnType === 'indices'
    ? new Map<number, number[]>()
    : new Map<number, string>();

  let lastTop: number | null = null;
  let currentLine = 0;
  let lineText = '';

  for (let i = 0; i < content.length; i++) {
    range.setStart(textNode, i);
    range.setEnd(textNode, i + 1);

    const rects = range.getClientRects();
    if (rects.length === 0) continue;

    const top = rects[rects.length - 1].top;

    if (lastTop === null) {
      lastTop = top; // For first char in current line, lastTop is top of itself
    }

    if (Math.abs(top - lastTop) > 1) { // if the char tops are more than 1px apart, it considers them
      if (returnType === 'strings') {
        (lineMap as StringsLineMap).set(currentLine, lineText);
        lineText = '';
      }
      currentLine++;
      lastTop = top;
    }

    if (returnType === 'indices') {
      if (!(lineMap as IndicesLineMap).has(currentLine)) {
        (lineMap as IndicesLineMap).set(currentLine, []);
      }
      (lineMap as IndicesLineMap).get(currentLine)!.push(i);
    } else {
      lineText += content[i];
    }
  }

  if (returnType === 'strings' && lineText) {
    (lineMap as StringsLineMap).set(currentLine, lineText);
  }

  return lineMap;
}
