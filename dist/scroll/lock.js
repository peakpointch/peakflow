import { addScrollbarPadding, removeScrollbarPadding } from "./scrollbar";
let scrollLockCount = 0;
function isBodyScrollLocked() {
  return scrollLockCount > 0;
}
function lockBodyScroll(smooth) {
  scrollLockCount++;
  if (scrollLockCount === 1) {
    if (smooth) addScrollbarPadding(document.body);
    document.body.style.overflow = "hidden";
  }
}
function unlockBodyScroll(smooth) {
  if (scrollLockCount > 0) scrollLockCount--;
  if (scrollLockCount === 0) {
    if (smooth) removeScrollbarPadding(document.body);
    document.body.style.removeProperty("overflow");
  }
}
export {
  isBodyScrollLocked,
  lockBodyScroll,
  unlockBodyScroll
};
