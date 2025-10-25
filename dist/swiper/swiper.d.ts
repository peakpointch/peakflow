import { Stylesheet } from "../utils";
import Swiper from "swiper";
import type { SwiperOptions } from "swiper/types";
import { BaseComponent } from "../base-component/index.js";
type SliderElement = "component" | "wrapper" | "controls" | "navigation" | "pagination" | "prev" | "next" | "counter-current" | "counter-separator" | "counter-total";
/**
 * A Swiper component wrapper for Webflow.
 *
 * @example
 * ```html
 * <!-- Swiper Component -->
 * <div
 *   data-swiper-id="my-swiper"
 *   data-swiper-element="component"
 *   class="swiper-container"
 *
 *   data-slides-per-view="auto"
 *   data-space-between="24"
 *   data-loop="true"
 *   data-autoplay="true"
 *   data-autoplay-delay="5000"
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
export declare class Slider extends BaseComponent<SliderElement> {
    swiper: Swiper;
    stylesheet: Stylesheet;
    static attr: {
        id: string;
        element: string;
        hide: string;
    };
    constructor(component: HTMLElement, instance: string);
    protected static readonly attributeSelector: import("../attributeselector/attributeselector.js").AttributeSelector<string>;
    static selector: import("../attributeselector/attributeselector.js").InstanceSelector<SliderElement>;
    static select: <U extends Element = HTMLElement>(element: SliderElement, instance?: string) => U;
    static selectAll: <U extends Element = HTMLElement>(element: SliderElement, instance?: string) => NodeListOf<U>;
    private static create;
    static initAll(container?: HTMLElement): void;
    static readOptions(swiperElement: HTMLElement): SwiperOptions;
}
export {};
