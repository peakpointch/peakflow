import Hypher from "hypher";
import german from "hyphenation.de";
const hypher = new Hypher(german);
function hyphenateDOM(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node;
  while (node = walker.nextNode()) {
    const parent = node?.parentElement;
    if (parent && !["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName) && !parent.matches(`[data-hyphenate="false"]`) && node.nodeValue?.trim()) {
      const hyphenated = hypher.hyphenateText(node.nodeValue);
      node.nodeValue = hyphenated;
    }
  }
}
function finalizeHyphenation(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.nodeValue && node.nodeValue.includes("\xAD")) {
      textNodes.push(node);
    }
  }
  for (const textNode of textNodes) {
    const original = textNode.nodeValue;
    const segments = original.split(/([\u00AD\u00A0 \-\u2013\u2014]+)/);
    let finalFragments = "";
    let unbrokenFragments = "";
    for (let i = 0; i < segments.length; i++) {
      const currentFragment = segments[i];
      if (/^[ \-\u2013\u2014]+$/.test(currentFragment)) {
        unbrokenFragments += currentFragment;
        finalFragments += unbrokenFragments;
        unbrokenFragments = "";
        continue;
      }
      if (currentFragment === "\xAD") {
        const nextFragment = segments[i + 1] || "";
        const didBreak = isLineBreakAtSoftHyphen(
          textNode,
          finalFragments,
          unbrokenFragments,
          nextFragment
        );
        if (didBreak) {
          finalFragments += unbrokenFragments + "-" + nextFragment;
          unbrokenFragments = "";
        } else {
          unbrokenFragments += nextFragment;
        }
        i++;
      } else {
        unbrokenFragments += currentFragment;
      }
    }
    finalFragments += unbrokenFragments;
    const newNode = document.createTextNode(finalFragments);
    textNode.parentElement?.replaceChild(newNode, textNode);
  }
}
function isLineBreakAtSoftHyphen(referenceNode, finalFragments, unbrokenFragments, nextFragment) {
  const parent = referenceNode.parentElement;
  if (!parent) return false;
  const superParent = parent.parentElement;
  if (!superParent) throw new Error(`Super parent is not defined.`);
  const clone = parent.cloneNode(false);
  clone.style.whiteSpace = "pre-wrap";
  const base = document.createElement("span");
  base.textContent = finalFragments;
  clone.appendChild(base);
  const probe = document.createElement("span");
  probe.style.whiteSpace = "pre-wrap";
  probe.textContent = unbrokenFragments || "_";
  clone.appendChild(probe);
  parent.style.display = "none";
  parent.insertAdjacentElement("beforebegin", clone);
  const heightBefore = probe.getBoundingClientRect().height;
  probe.textContent = unbrokenFragments + "\xAD" + nextFragment;
  const heightAfter = probe.getBoundingClientRect().height;
  const didBreak = heightAfter > heightBefore;
  superParent.removeChild(clone);
  parent.style.removeProperty("display");
  return didBreak;
}
function finalizeHyphenationBinarySearch(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.nodeValue && node.nodeValue.includes("\xAD")) {
      textNodes.push(node);
    }
  }
  for (const textNode of textNodes) {
    const original = textNode.nodeValue;
    const words = original.split(/([\s\-\u2013\u2014]+)/);
    let finalText = "";
    for (const word of words) {
      if (word.includes("\xAD")) {
        finalText += finalizeWordWithBinarySearch(textNode, finalText, word);
      } else {
        finalText += word;
      }
    }
    const newNode = document.createTextNode(finalText);
    textNode.parentElement?.replaceChild(newNode, textNode);
  }
}
function finalizeWordWithBinarySearch(referenceNode, prefixText, word) {
  const softHyphenIndices = getSoftHyphenIndices(word);
  if (softHyphenIndices.length === 0) return word;
  function buildWordWithHyphenAt(word2, index, test = false) {
    const newWord = `${word2}`;
    const chars = [...newWord];
    chars[softHyphenIndices[index]] = test ? "\xAD" : "-";
    return chars.filter((ch) => ch !== "\xAD").join("");
  }
  const wordWithoutHyphens = word.replace(/\u00AD/g, "");
  const didLineBreak = doesLineBreak(referenceNode, prefixText, word);
  if (!didLineBreak) {
    return wordWithoutHyphens;
  }
  const didWordBreak = doesWordBreak(referenceNode, prefixText, word);
  if (!didWordBreak) {
    return wordWithoutHyphens;
  }
  let low = 0;
  let high = softHyphenIndices.length - 1;
  let bestIndex = -1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const testWord = buildWordWithHyphenAt(word, mid);
    const breaksMidWord = doesWordBreak(referenceNode, prefixText, testWord);
    if (breaksMidWord) {
      bestIndex = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  if (bestIndex === -1) {
    return word.replace(/\u00AD/g, "");
  } else {
    return buildWordWithHyphenAt(word, bestIndex);
  }
}
function getSoftHyphenIndices(word) {
  const indices = [];
  for (let i = 0; i < word.length; i++) {
    if (word[i] === "\xAD") indices.push(i);
  }
  return indices;
}
function doesLineBreak(referenceNode, prefixText, testWord) {
  const parent = referenceNode.parentElement;
  if (!parent) return false;
  const superParent = parent.parentElement;
  if (!superParent) throw new Error("Super parent is not defined.");
  const clone = parent.cloneNode(false);
  clone.style.whiteSpace = "pre-wrap";
  parent.style.display = "none";
  parent.insertAdjacentElement("beforebegin", clone);
  const span = document.createElement("span");
  clone.appendChild(span);
  span.textContent = prefixText || "_";
  const heightBefore = span.getBoundingClientRect().height;
  span.textContent = prefixText + testWord;
  const heightAfter = span.getBoundingClientRect().height;
  const didBreak = heightAfter > heightBefore;
  prefixText;
  testWord;
  superParent.removeChild(clone);
  parent.style.removeProperty("display");
  return didBreak;
}
function doesWordBreak(referenceNode, prefixText, word) {
  const parent = referenceNode.parentElement;
  if (!parent) return false;
  const superParent = parent.parentElement;
  if (!superParent) throw new Error("Super parent is not defined.");
  const clone = parent.cloneNode(false);
  clone.style.whiteSpace = "pre-wrap";
  const base = document.createElement("span");
  base.textContent = prefixText;
  clone.appendChild(base);
  const testText = document.createTextNode(word);
  const span = document.createElement("span");
  span.appendChild(testText);
  clone.appendChild(span);
  parent.style.display = "none";
  parent.insertAdjacentElement("beforebegin", clone);
  const lineMap = getRenderedLineMap(testText);
  const breaks = lineMap.size > 1;
  superParent.removeChild(clone);
  parent.style.removeProperty("display");
  return breaks;
}
function getRenderedLineMap(textNode) {
  const range = document.createRange();
  const lines = /* @__PURE__ */ new Map();
  const textContent = textNode.textContent || "";
  const parent = textNode.parentElement;
  if (!parent) throw new Error("Text node must be attached to a DOM element.");
  let lastTop = null;
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
export {
  finalizeHyphenation,
  finalizeHyphenationBinarySearch,
  hyphenateDOM
};
