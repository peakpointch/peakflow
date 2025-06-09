export function getVisibleScrollbarWidth(element: HTMLElement): number {
  return isScrollbarVisible(element) ? getScrollbarWidth(element) : 0;
}

export function isScrollbarVisible(element: HTMLElement): boolean {
  const style = getComputedStyle(element);
  const overflowY = style.overflowY;

  // If scrolling is explicitly prevented
  if (overflowY === 'hidden' || overflowY === 'clip') {
    return false;
  }

  // For <body>, rely on window scroll checks
  if (element === document.body || element === document.documentElement) {
    return window.innerWidth > document.documentElement.clientWidth;
  }

  // For regular elements, compare scrollHeight vs clientHeight
  return element.scrollHeight > element.clientHeight;
}

/**
 * @returns width of the scrollbar
 */
export function getScrollbarWidth(element: HTMLElement): number {
  // Create an off-screen scrollable div to measure scrollbar width
  const scrollDiv = document.createElement('div');
  scrollDiv.style.visibility = 'hidden';
  scrollDiv.style.overflow = 'scroll';
  scrollDiv.style.position = 'absolute';
  scrollDiv.style.top = '-9999px';
  scrollDiv.style.width = '100px';
  element.appendChild(scrollDiv);

  // Add inner div to get inner width
  const innerDiv = document.createElement('div');
  innerDiv.style.width = '100%';
  scrollDiv.appendChild(innerDiv);

  const scrollbarWidth = scrollDiv.offsetWidth - innerDiv.offsetWidth;

  // Cleanup
  scrollDiv.remove();
  return scrollbarWidth;
}

export function addScrollbarPadding(element: HTMLElement, scrollbarElement?: HTMLElement): void {
  if (!scrollbarElement) scrollbarElement = element;

  const scrollbarWidth = getVisibleScrollbarWidth(scrollbarElement);
  const currentPadding = parseFloat(getComputedStyle(element).paddingRight || '0');

  if (scrollbarWidth === 0) return;

  // Store original padding if not stored already
  if (!element.dataset.originalPaddingRight) {
    element.dataset.originalPaddingRight = currentPadding.toString();
  }

  // Add scrollbar width to current padding
  element.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
}

export function removeScrollbarPadding(element: HTMLElement): void {
  const originalPadding = element.dataset.originalPaddingRight;

  if (originalPadding !== undefined) {
    element.style.paddingRight = `${originalPadding}px`;
    if (originalPadding === '0') {
      element.style.removeProperty('paddingRight');
    }
    delete element.dataset.originalPaddingRight;
  }
}
