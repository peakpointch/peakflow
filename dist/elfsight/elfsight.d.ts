import { type ElementGetter } from "../utils/index.js";
export interface ElfsightLoadOptions {
    /** Callback delay in ms */
    delay?: number;
    /** Min width of the widget in px */
    minWidth?: number;
    /** Min height of the widget in px */
    minHeight?: number;
    /**
     * Add your own conditions necessary for the widget to be considered as loaded
     */
    conditions?: (container: HTMLElement) => boolean;
}
/**
 * Attaches a load listener to one or multiple widget containers.
 */
export declare function onWidgetLoad<T>(container: ElementGetter, callback: () => T, options?: ElfsightLoadOptions): Promise<T[]>;
export declare function onElfsightLoad<T>(container: HTMLElement, callback: () => T, options?: ElfsightLoadOptions): Promise<T>;
