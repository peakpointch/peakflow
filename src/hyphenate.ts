import Hypher from 'hypher';
import german from 'hyphenation.de';

const hypher = new Hypher(german);

/**
 * Replaces text nodes with spans containing hyphenated words using <wbr>
 */
export function hyphenateDOM(container: HTMLElement) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Text | null;

  while ((node = walker.nextNode() as Text | null)) {
    const parent = node?.parentElement;
    if (
      parent &&
      !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName) &&
      !parent.matches(`[data-hyphenate="false"]`) &&
      node.nodeValue?.trim()
    ) {
      const hyphenated = hypher.hyphenateText(node.nodeValue);
      node.nodeValue = hyphenated;
    }
  }
}

/**
 * Converts soft hyphens in all `Text` nodes within the given `container` into real hyphens, 
 * but only if they cause a line break.
 *
 * @param container Ancestor of all the `Text` nodes to convert
 */
export function finalizeHyphenation(container: HTMLElement) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node.nodeValue && node.nodeValue.includes('\u00AD')) {
      textNodes.push(node);
    }
  }

  for (const textNode of textNodes) {
    const original = textNode.nodeValue!;
    const segments = original.split(/([\u00AD\u00A0 \-\u2013\u2014]+)/);

    let finalFragments = '';
    let unbrokenFragments = '';

    for (let i = 0; i < segments.length; i++) {
      const currentFragment = segments[i];

      if (/^[ \-\u2013\u2014]+$/.test(currentFragment)) {
        unbrokenFragments += currentFragment;
        finalFragments += unbrokenFragments;
        unbrokenFragments = '';
        continue;
      }

      if (currentFragment === '\u00AD') {
        const nextFragment = segments[i + 1] || '';

        const didBreak = isLineBreakAtSoftHyphen(
          textNode,
          finalFragments,
          unbrokenFragments,
          nextFragment
        );

        if (didBreak) {
          // Commit the currentFragments with a hyphen and nextFragment
          finalFragments += unbrokenFragments + '-' + nextFragment;
          unbrokenFragments = ''; // Reset since we broke line
        } else {
          // Accumulate into current line
          unbrokenFragments += nextFragment;
        }

        i++; // Skip nextFragment
      } else {
        unbrokenFragments += currentFragment;
      }
    }

    // Append any remaining unbroken fragments
    finalFragments += unbrokenFragments;

    const newNode = document.createTextNode(finalFragments);
    textNode.parentElement?.replaceChild(newNode, textNode);
  }
}

/**
 * Check if `nextFragment` causes a line break of `referenceNode`.
 *
 * @param referenceNode Current `Text` node in examination
 * @param finalFragments Fragments of the `referenceNode` with final hyphening
 * @param unbrokenFragments Fragments of the `referenceNode` that haven't caused a line break yet
 * @param nextFragment Fragment to check whether it causes a line break or not
 */
function isLineBreakAtSoftHyphen(
  referenceNode: Text,
  finalFragments: string,
  unbrokenFragments: string,
  nextFragment: string
): boolean {
  const parent = referenceNode.parentElement;
  if (!parent) return false;

  const superParent = parent.parentElement;
  if (!superParent) throw new Error(`Super parent is not defined.`);

  // Clone the parent and insert the test spans into it
  const clone = parent.cloneNode(false) as HTMLElement;
  clone.style.whiteSpace = 'pre-wrap';

  const base = document.createElement('span');
  base.textContent = finalFragments;
  clone.appendChild(base);

  const probe = document.createElement('span');
  probe.style.whiteSpace = 'pre-wrap';
  probe.textContent = unbrokenFragments || "_";
  clone.appendChild(probe);

  parent.style.display = 'none';
  parent.insertAdjacentElement('beforebegin', clone);
  const heightBefore = probe.getBoundingClientRect().height;

  probe.textContent = unbrokenFragments + '\u00AD' + nextFragment;
  const heightAfter = probe.getBoundingClientRect().height;

  const didBreak = heightAfter > heightBefore;

  superParent.removeChild(clone);
  parent.style.removeProperty('display');

  return didBreak;
}

/**
 * Hyphenation finalizer with binary search per word.
 * Converts soft hyphens that cause a line break into real hyphens.
 */
export function finalizeHyphenationBinarySearch(container: HTMLElement) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node.nodeValue && node.nodeValue.includes('\u00AD')) {
      textNodes.push(node);
    }
  }

  for (const textNode of textNodes) {
    const original = textNode.nodeValue!;
    // Split by spaces preserving spaces in the array
    const words = original.split(/([\s\-\u2013\u2014]+)/);

    let finalText = '';

    for (const word of words) {
      if (word.includes('\u00AD')) {
        finalText += finalizeWordWithBinarySearch(textNode, finalText, word);
      } else {
        finalText += word; // just spaces or normal words without soft hyphens
      }
    }

    const newNode = document.createTextNode(finalText);
    textNode.parentElement?.replaceChild(newNode, textNode);
  }
}

/**
 * Performs binary search on a word with soft hyphens to find
 * the last hyphenation point that fits on the line.
 */
function finalizeWordWithBinarySearch(
  referenceNode: Text,
  prefixText: string,   // The text before this word in the container
  word: string          // Word containing soft hyphens
): string {
  const softHyphenIndices = getSoftHyphenIndices(word);
  if (softHyphenIndices.length === 0) return word;

  // Helper to replace soft hyphens with real hyphen at a specific index
  function buildWordWithHyphenAt(word: string, index: number, test: boolean = false): string {
    // Replace the soft hyphen at softHyphenIndices[index] with '-'
    const newWord = `${word}`;
    const chars = [...newWord];
    chars[softHyphenIndices[index]] = test ? '\u00AD' : '-';
    // Remove other soft hyphens for safety
    return chars.filter(ch => ch !== '\u00AD').join('');
  }

  const wordWithoutHyphens = word.replace(/\u00AD/g, '');
  const didLineBreak = doesLineBreak(referenceNode, prefixText, word);
  if (!didLineBreak) {
    return wordWithoutHyphens;
  }

  // Step 1: Check if the word is broken mid-word or just wrapped
  const didWordBreak = doesWordBreak(referenceNode, prefixText, word);
  if (!didWordBreak) {
    return wordWithoutHyphens; // Word isn't broken — do not hyphenate
  }

  // Binary search for the last hyphenation point that fits
  let low = 0;
  let high = softHyphenIndices.length - 1;
  let bestIndex = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const testWord = buildWordWithHyphenAt(word, mid);

    const breaksMidWord = doesWordBreak(referenceNode, prefixText, testWord);

    if (breaksMidWord) {
      bestIndex = mid;
      low = mid + 1; // Try to find a later hyphenation point
    } else {
      high = mid - 1;
    }
  }

  if (bestIndex === -1) {
    // No soft hyphen fits, remove all soft hyphens
    return word.replace(/\u00AD/g, '');
  } else {
    // Replace soft hyphens except the chosen one
    return buildWordWithHyphenAt(word, bestIndex)
  }
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

/**
 * Checks if inserting `testWord` after `prefixText` causes a line break
 * relative to the original `referenceNode`'s parent element.
 *
 * Returns true if a line break happens, false if it fits on one line.
 */
function doesLineBreak(
  referenceNode: Text,
  prefixText: string,
  testWord: string
): boolean {
  const parent = referenceNode.parentElement;
  if (!parent) return false;

  const superParent = parent.parentElement;
  if (!superParent) throw new Error('Super parent is not defined.');

  // Clone the parent but without children (shallow clone)
  const clone = parent.cloneNode(false) as HTMLElement;
  clone.style.whiteSpace = 'pre-wrap';

  // Hide the original parent for accurate layout environment
  parent.style.display = 'none';
  parent.insertAdjacentElement('beforebegin', clone);

  const span = document.createElement('span');
  clone.appendChild(span);

  // Measure heights to detect line breaks
  span.textContent = prefixText || '_';
  const heightBefore = span.getBoundingClientRect().height;

  span.textContent = prefixText + testWord;
  const heightAfter = span.getBoundingClientRect().height;

  const didBreak = heightAfter > heightBefore;

  prefixText;
  testWord;

  // Remove clone and restore original parent visibility
  superParent.removeChild(clone);
  parent.style.removeProperty('display');

  return didBreak;
}

function doesWordBreak(referenceNode: Text, prefixText: string, word: string): boolean {
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

  const lineMap = getRenderedLineMap(testText);

  const breaks = lineMap.size > 1;

  superParent.removeChild(clone);
  parent.style.removeProperty('display');

  return breaks;
}

function getRenderedLineMap(textNode: Text): Map<number, string> {
  const range = document.createRange();
  const lines = new Map<number, string>();

  const textContent = textNode.textContent || "";
  const parent = textNode.parentElement;
  if (!parent) throw new Error("Text node must be attached to a DOM element.");

  let lastTop: number | null = null;
  let currentLine = 0;
  let lineText = "";

  for (let i = 0; i < textContent.length; i++) {
    range.setStart(textNode, i);
    range.setEnd(textNode, i + 1);
    const rects = range.getClientRects();
    if (rects.length === 0) continue;

    const top = rects[0].top;

    if (lastTop === null) {
      lastTop = top;
    }

    if (Math.abs(top - lastTop) > 1) {
      lines.set(currentLine, lineText);
      currentLine++;
      lineText = "";
      lastTop = top;
    }

    lineText += textContent[i];
  }

  if (lineText) {
    lines.set(currentLine, lineText);
  }

  return lines;
}
