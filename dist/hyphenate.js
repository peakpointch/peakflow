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
    const segments = original.split(/([\u00AD\u00A0 \-–—]+)/);
    let finalFragments = "";
    let unbrokenFragments = "";
    for (let i = 0; i < segments.length; i++) {
      const currentFragment = segments[i];
      if (currentFragment === " ") {
        unbrokenFragments += currentFragment;
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
export {
  finalizeHyphenation,
  hyphenateDOM
};
