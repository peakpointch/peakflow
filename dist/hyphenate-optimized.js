function finalizeHyphenationUsingLineMap(container) {
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
    const didBreak = stringLineMap.size > 1;
    if (!didBreak) {
      textNode.textContent = textNode.textContent.replace(/\u00AD/g, "");
      continue;
    }
    const newLines = /* @__PURE__ */ new Map();
    for (const [lineIndex, lineText] of stringLineMap.entries()) {
      let newLineText = lineText;
      const lastIndex = lineText.length - 1;
      const possibleSoftHyphen = lineText[lastIndex];
      if (possibleSoftHyphen === "\xAD") {
        newLineText = replaceCharAt(lineText, lastIndex, "-");
      }
      newLineText = newLineText.replace(/\u00AD/g, "");
      newLines.set(lineIndex, newLineText);
    }
    const finalText = Array.from(newLines.values()).join("");
    const newNode = document.createTextNode(finalText);
    parent.replaceChild(newNode, textNode);
  }
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
  finalizeHyphenationUsingLineMap
};
