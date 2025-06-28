import { addScrollbarPadding, removeScrollbarPadding } from "./scrollbar.js";

/**
 * Count how many times the body scroll gets locked to avoid unintended unlocks.
 */
let scrollLockCount = 0;

export function isBodyScrollLocked(): boolean {
  return scrollLockCount > 0;
}

/**
 * Locks the scroll on the document body.
 *
 * This function sets the `overflow` style of the `body` element to `"hidden"`,
 * preventing the user from scrolling the page. Commonly used when displaying
 * modals, overlays, or other components that require the page to remain static.
 *
 * @param smooth replace the scrollbar with padding of the same width as the scrollbar
 */
export function lockBodyScroll(smooth: boolean): void {
  scrollLockCount++;
  if (scrollLockCount === 1) {
    if (smooth) addScrollbarPadding(document.body);
    document.body.style.overflow = "hidden";
  }
}

/**
 * Unlocks the scroll on the document body.
 *
 * This function removes the `overflow` style from the `body` element,
 * allowing the user to scroll the page again. Typically used when hiding
 * modals, overlays, or other components that previously locked scrolling.
 *
 * @param smooth cleanup the padding added by lockBodyScroll's smooth option
 */
export function unlockBodyScroll(smooth: boolean): void {
  if (scrollLockCount > 0) scrollLockCount--;
  if (scrollLockCount === 0) {
    if (smooth) removeScrollbarPadding(document.body);
    document.body.style.removeProperty("overflow");
  }
}

