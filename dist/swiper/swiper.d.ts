import { Stylesheet } from "../utils";
import Swiper from "swiper";
import type { SwiperOptions } from "swiper/types";
import { BaseComponent } from "../base-component/index.js";
type SwiperElement = "component" | "wrapper" | "controls" | "navigation" | "pagination" | "prev" | "next" | "counter-current" | "counter-separator" | "counter-total";
/**
 * Initializes all Webflow Swiper components on the page.
 *
 * @example
 * ```html
 * <!-- Swiper Component -->
 * <div
 *   data-swiper-id="my-swiper"
 *   data-swiper-element="component"
 *   data-swiper-mode="cms"
 *   data-swiper-slides-per-view="auto"
 *   data-swiper-space-between="24"
 *   data-swiper-loop="true"
 *   data-swiper-autoplay="true"
 *   data-swiper-autoplay-delay="5000"
 *   class="swiper-container"
 * >
 *   <div class="swiper-wrapper">
 *     <!-- Swiper slides here -->
 *   </div>
 *
 *   <div class="swiper-pagination"></div>
 *
 *   <div
 *      data-swiper-id="my-swiper"
 *      data-swiper-element="navigation"
 *   >
 *     <button data-swiper-element="prev">Prev</button>
 *     <button data-swiper-element="next">Next</button>
 *   </div>
 * </div>
 * ```
 */
export declare class Slider extends BaseComponent<SwiperElement> {
    swiper: Swiper;
    styles: Stylesheet;
    static attr: {
        id: string;
        element: string;
    };
    constructor(component: HTMLElement, instance: string);
    protected static readonly attributeSelector: import("../attributeselector/attributeselector.js").AttributeSelector<string>;
    static selector: import("../attributeselector/attributeselector.js").InstanceSelector<SwiperElement>;
    static select: <U extends Element = HTMLElement>(element: SwiperElement, instance?: string) => U;
    static selectAll: <U extends Element = HTMLElement>(element: SwiperElement, instance?: string) => NodeListOf<U>;
    private static create;
    static initAll(container?: HTMLElement): void;
    static readOptions(swiperElement: HTMLElement): SwiperOptions;
}
export {};
