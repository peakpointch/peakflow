import { isScrollbarVisible } from "./scrollbar.js";
export class ScrollHandler {
    constructor(config) {
        this.scrollTimeoutId = null;
        this.scrollWrapper = config.scrollWrapper;
        this.stickyTop = config.stickyTop ?? null;
        this.stickyBottom = config.stickyBottom ?? null;
        if (!this.scrollWrapper) {
            throw new Error(`Couldn't construct ScrollHandler: The property "scrollWrapper" can't be undefined`);
        }
    }
    clearScrollTimeout() {
        if (this.scrollTimeoutId !== null) {
            clearTimeout(this.scrollTimeoutId);
            this.scrollTimeoutId = null;
        }
    }
    scrollTo(element, options = {}) {
        this.clearScrollTimeout();
        if (!element || !this.scrollWrapper.contains(element)) {
            return Promise.reject(new Error("The element to scroll into view is not inside the scroll container."));
        }
        if (!isScrollbarVisible(this.scrollWrapper))
            return Promise.resolve();
        const opts = {
            delay: options.delay ?? 0,
            offset: options.offset ?? 0,
            position: options.position ?? "start",
            behavior: options.behavior ?? "smooth",
        };
        return new Promise((resolve) => {
            this.scrollTimeoutId = window.setTimeout(() => {
                const elementRect = element.getBoundingClientRect();
                const wrapperRect = this.scrollWrapper.getBoundingClientRect();
                const stickyTopHeight = this.stickyTop?.clientHeight || 0;
                const stickyBottomHeight = this.stickyBottom?.clientHeight || 0;
                const relativePosition = elementRect.top - wrapperRect.top;
                const isFullyVisible = elementRect.top >= wrapperRect.top + stickyTopHeight &&
                    elementRect.bottom <= wrapperRect.bottom - stickyBottomHeight;
                let scrollOffset = 0;
                switch (opts.position) {
                    case "start":
                        scrollOffset = relativePosition - stickyTopHeight - opts.offset - 2;
                        break;
                    case "center":
                        scrollOffset =
                            relativePosition -
                                this.scrollWrapper.clientHeight / 2 +
                                element.clientHeight / 2 +
                                opts.offset;
                        break;
                    case "end":
                        scrollOffset =
                            relativePosition -
                                this.scrollWrapper.clientHeight +
                                element.clientHeight +
                                stickyBottomHeight +
                                opts.offset;
                        break;
                    case "nearest":
                        if (isFullyVisible) {
                            this.clearScrollTimeout();
                            resolve();
                            return;
                        }
                        scrollOffset =
                            relativePosition -
                                this.scrollWrapper.clientHeight / 2 +
                                element.clientHeight / 2 +
                                opts.offset;
                        break;
                }
                this.scrollWrapper.scrollBy({
                    top: scrollOffset,
                    behavior: opts.behavior,
                });
                resolve();
            }, opts.delay);
        });
    }
}
