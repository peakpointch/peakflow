import { isScrollbarVisible } from "./lock";
function createScrollTo(config) {
  let scrollTimeoutId = null;
  const clearScrollTimeout = () => {
    if (scrollTimeoutId !== null) {
      clearTimeout(scrollTimeoutId);
      scrollTimeoutId = null;
    }
  };
  const { scrollWrapper, stickyTop, stickyBottom } = config;
  const scrollTo = async (element, options = {}) => {
    clearScrollTimeout();
    if (!element || !scrollWrapper.contains(element)) {
      throw new Error("The element to scroll into view is not inside the scroll container.");
    }
    if (!isScrollbarVisible(scrollWrapper)) return;
    const opts = {
      delay: options.delay ?? 0,
      offset: options.offset ?? 0,
      position: options.position ?? "start"
    };
    return new Promise((resolve) => {
      scrollTimeoutId = window.setTimeout(() => {
        const elementRect = element.getBoundingClientRect();
        const wrapperRect = scrollWrapper.getBoundingClientRect();
        const stickyTopHeight = stickyTop?.clientHeight || 0;
        const stickyBottomHeight = stickyBottom?.clientHeight || 0;
        const relativePosition = elementRect.top - wrapperRect.top;
        const isFullyVisible = elementRect.top >= wrapperRect.top + stickyTopHeight && elementRect.bottom <= wrapperRect.bottom - stickyBottomHeight;
        let scrollOffset = 0;
        switch (opts.position) {
          case "start":
            scrollOffset = relativePosition - stickyTopHeight - opts.offset - 2;
            break;
          case "center":
            scrollOffset = relativePosition - scrollWrapper.clientHeight / 2 + element.clientHeight / 2 + opts.offset;
            break;
          case "end":
            scrollOffset = relativePosition - scrollWrapper.clientHeight + element.clientHeight + stickyBottomHeight + opts.offset;
            break;
          case "nearest":
            if (isFullyVisible) {
              clearScrollTimeout();
              return resolve();
            }
            scrollOffset = relativePosition - scrollWrapper.clientHeight / 2 + element.clientHeight / 2 + opts.offset;
            break;
        }
        scrollWrapper.scrollBy({
          top: scrollOffset,
          behavior: "smooth"
        });
        resolve();
      }, opts.delay);
    });
  };
  return { scrollTo, clearScrollTimeout };
}
export {
  createScrollTo
};
