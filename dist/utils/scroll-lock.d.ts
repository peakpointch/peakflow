export declare function isBodyScrollLocked(): boolean;
/**
 * Locks the scroll on the document body.
 *
 * This function sets the `overflow` style of the `body` element to `"hidden"`,
 * preventing the user from scrolling the page. Commonly used when displaying
 * modals, overlays, or other components that require the page to remain static.
 *
 * @param smooth replace the scrollbar with padding of the same width as the scrollbar
 */
export declare function lockBodyScroll(smooth: boolean): void;
/**
 * Unlocks the scroll on the document body.
 *
 * This function removes the `overflow` style from the `body` element,
 * allowing the user to scroll the page again. Typically used when hiding
 * modals, overlays, or other components that previously locked scrolling.
 *
 * @param smooth cleanup the padding added by lockBodyScroll's smooth option
 */
export declare function unlockBodyScroll(smooth: boolean): void;
export declare function isScrollbarVisible(element: HTMLElement): boolean;
/**
 * @returns width of the scrollbar
 */
export declare function getScrollbarWidth(element: HTMLElement): number;
export declare function getVisibleScrollbarWidth(element: HTMLElement): number;
export declare function adjustPaddingForScrollbar(element: HTMLElement, scrollbarElement?: HTMLElement): void;
export declare function resetScrollbarPadding(element: HTMLElement): void;
