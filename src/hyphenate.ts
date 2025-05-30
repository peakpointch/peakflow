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
