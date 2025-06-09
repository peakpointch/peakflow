let scrollLockCount = 0;
function isBodyScrollLocked() {
  return scrollLockCount > 0;
}
function lockBodyScroll(smooth) {
  scrollLockCount++;
  if (scrollLockCount === 1) {
    if (smooth) adjustPaddingForScrollbar(document.body);
    document.body.style.overflow = "hidden";
  }
}
function unlockBodyScroll(smooth) {
  if (scrollLockCount > 0) scrollLockCount--;
  if (scrollLockCount === 0) {
    if (smooth) resetScrollbarPadding(document.body);
    document.body.style.removeProperty("overflow");
  }
}
function isScrollbarVisible(element) {
  const style = getComputedStyle(element);
  const overflowY = style.overflowY;
  if (overflowY === "hidden" || overflowY === "clip") {
    return false;
  }
  if (element === document.body || element === document.documentElement) {
    return window.innerWidth > document.documentElement.clientWidth;
  }
  return element.scrollHeight > element.clientHeight;
}
function getScrollbarWidth(element) {
  const scrollDiv = document.createElement("div");
  scrollDiv.style.visibility = "hidden";
  scrollDiv.style.overflow = "scroll";
  scrollDiv.style.position = "absolute";
  scrollDiv.style.top = "-9999px";
  scrollDiv.style.width = "100px";
  element.appendChild(scrollDiv);
  const innerDiv = document.createElement("div");
  innerDiv.style.width = "100%";
  scrollDiv.appendChild(innerDiv);
  const scrollbarWidth = scrollDiv.offsetWidth - innerDiv.offsetWidth;
  scrollDiv.remove();
  return scrollbarWidth;
}
function getVisibleScrollbarWidth(element) {
  return isScrollbarVisible(element) ? getScrollbarWidth(element) : 0;
}
function adjustPaddingForScrollbar(element, scrollbarElement) {
  if (!scrollbarElement) scrollbarElement = element;
  const scrollbarWidth = getVisibleScrollbarWidth(scrollbarElement);
  const currentPadding = parseFloat(getComputedStyle(element).paddingRight || "0");
  if (scrollbarWidth === 0) return;
  if (!element.dataset.originalPaddingRight) {
    element.dataset.originalPaddingRight = currentPadding.toString();
  }
  element.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
}
function resetScrollbarPadding(element) {
  const originalPadding = element.dataset.originalPaddingRight;
  if (originalPadding !== void 0) {
    element.style.paddingRight = `${originalPadding}px`;
    if (originalPadding === "0") {
      element.style.removeProperty("paddingRight");
    }
    delete element.dataset.originalPaddingRight;
  }
}
export {
  adjustPaddingForScrollbar,
  getScrollbarWidth,
  getVisibleScrollbarWidth,
  isBodyScrollLocked,
  isScrollbarVisible,
  lockBodyScroll,
  resetScrollbarPadding,
  unlockBodyScroll
};
