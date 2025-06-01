import Hypher from "hypher";
function softHyphenizer(container, language) {
  const hypher = new Hypher(language);
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
function solidHyphens(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.nodeValue && node.nodeValue.includes("\xAD")) {
      textNodes.push(node);
    }
  }
  for (const textNode of textNodes) {
    const parent = textNode.parentElement;
    if (!parent) continue;
    let stringLineMap = getRenderedLineMap(textNode, "strings");
    const didNodeBreak = stringLineMap.size > 1;
    if (!didNodeBreak) {
      textNode.textContent = textNode.textContent?.replace(/\u00AD/g, "") ?? "";
      continue;
    }
    const newLines = /* @__PURE__ */ new Map();
    let lineIndex = 0;
    while (lineIndex < stringLineMap.size) {
      const lineText = stringLineMap.get(lineIndex);
      if (lineText === null) break;
      let lineReflow = false;
      let newLineText = lineText;
      const lastIndex = lineText.length - 1;
      const possibleSoftHyphen = lineText[lastIndex];
      if (possibleSoftHyphen === "\xAD") {
        let testLine = lineText;
        let lastWord = getLastWord(testLine);
        lastWord = replaceCharAt(lastWord, lastWord.length - 1, "-");
        const firstWord = getFirstWordOfLine(stringLineMap, lineIndex + 1);
        const currLineWithoutLastWord = testLine.slice(0, testLine.length - lastWord.length);
        const prefixText = Array.from(newLines.values()).join("") + currLineWithoutLastWord;
        const didWordBreak = doesWordBreak(textNode, prefixText, lastWord + firstWord);
        if (didWordBreak) {
          newLineText = replaceCharAt(lineText, lastIndex, "-");
        } else {
          lineReflow = true;
        }
      }
      newLineText = newLineText.replace(/\u00AD/g, "");
      newLines.set(lineIndex, newLineText);
      if (lineReflow) {
        const updatedLineMap = finalizeLineWithReflow(textNode, stringLineMap, newLines, lineIndex);
        stringLineMap = updatedLineMap;
        continue;
      }
      lineIndex++;
    }
    textNode.textContent = Array.from(newLines.values()).join("");
  }
}
function finalizeLineWithReflow(textNode, originalLineMap, newLines, currentLineIndex) {
  const linesToProcess = /* @__PURE__ */ new Map();
  for (const [i, text] of newLines.entries()) {
    linesToProcess.set(i, text);
  }
  const mergedLines = [
    ...Array.from(linesToProcess.values()),
    ...Array.from(originalLineMap.entries()).filter(([i]) => i > currentLineIndex).map(([, line]) => line)
  ];
  const mergedText = mergedLines.join("");
  textNode.textContent = mergedText;
  const updatedMap = getRenderedLineMap(textNode, "strings");
  return updatedMap;
}
function getFirstWordOfLine(lineMap, lineIndex) {
  const line = lineMap.get(lineIndex) ?? "";
  return getFirstWord(line);
}
function getLastWordOfLine(lineMap, lineIndex) {
  const line = lineMap.get(lineIndex) ?? "";
  return getLastWord(line);
}
function getFirstWord(str) {
  const words = str.split(/[\s\-\u2013\u2014]+/).filter(Boolean);
  return words[0] ?? "";
}
function getLastWord(str) {
  const words = str.split(/[\s\-\u2013\u2014]+/).filter(Boolean);
  return words[words.length - 1] ?? "";
}
function replaceCharAt(str, index, replacement) {
  if (index < 0 || index >= str.length) {
    throw new RangeError("Index out of bounds");
  }
  return str.slice(0, index) + replacement + str.slice(index + 1);
}
function getSoftHyphenIndices(word) {
  const indices = [];
  for (let i = 0; i < word.length; i++) {
    if (word[i] === "\xAD") indices.push(i);
  }
  return indices;
}
function findLineForCharIndex(index, lineMap) {
  for (const [line, indices] of lineMap.entries()) {
    if (indices.includes(index)) return line;
  }
  return null;
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
  const lineMap = getRenderedLineMap(testText, "strings");
  const breaks = lineMap.size > 1;
  superParent.removeChild(clone);
  parent.style.removeProperty("display");
  return breaks;
}
function getRenderedLineMap(textNode, returnType) {
  const range = document.createRange();
  const content = textNode.textContent || "";
  const parent = textNode.parentElement;
  if (!parent) throw new Error("Text node must be in DOM.");
  const lineMap = returnType === "indices" ? /* @__PURE__ */ new Map() : /* @__PURE__ */ new Map();
  let lastTop = null;
  let currentLine = 0;
  let lineText = "";
  for (let i = 0; i < content.length; i++) {
    range.setStart(textNode, i);
    range.setEnd(textNode, i + 1);
    const rects = range.getClientRects();
    if (rects.length === 0) continue;
    const top = rects[rects.length - 1].top;
    if (lastTop === null) {
      lastTop = top;
    }
    if (Math.abs(top - lastTop) > 1) {
      if (returnType === "strings") {
        lineMap.set(currentLine, lineText);
        lineText = "";
      }
      currentLine++;
      lastTop = top;
    }
    if (returnType === "indices") {
      if (!lineMap.has(currentLine)) {
        lineMap.set(currentLine, []);
      }
      lineMap.get(currentLine).push(i);
    } else {
      lineText += content[i];
    }
  }
  if (returnType === "strings" && lineText) {
    lineMap.set(currentLine, lineText);
  }
  return lineMap;
}
export {
  doesWordBreak,
  getRenderedLineMap,
  softHyphenizer,
  solidHyphens
};
