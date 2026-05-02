import { type Attribute, type Attributes } from "../selector/index.js";
import { Stylesheet } from "../utils";
import type { CamelToDash } from "../typeutils";
import Swiper from "swiper";
import type { AutoplayOptions, NavigationOptions, SwiperOptions } from "swiper/types";
import { BaseComponent, type BaseSettings } from "../base-component/index.js";
type SliderElement = "component" | "wrapper" | "controls" | "navigation" | "pagination" | "prev" | "next" | "counter-current" | "counter-separator" | "counter-total";
type SliderHideOptions = "hideNone" | "hideComponent" | "emptyState";
type SliderAttribute = "data-swiper-id" | "data-swiper-element" | "data-swiper-hide-options" | `data-${CamelToDash<keyof SwiperOptions>}` | `data-nav-${CamelToDash<keyof NavigationOptions>}` | `data-autoplay-${CamelToDash<keyof AutoplayOptions>}`;
interface SwiperAttributes extends Attributes<string, SliderAttribute> {
    id: Attribute<"data-swiper-id", string>;
    element: Attribute<"data-swiper-element", SliderElement>;
    hide: Attribute<"data-swiper-hide-options", SliderHideOptions>;
    allowTouchMove: Attribute<"data-allow-touch-move", boolean>;
    autoHeight: Attribute<"data-auto-height", boolean>;
    autoplay: Attribute<"data-autoplay", boolean>;
    autoplayDelay: Attribute<"data-autoplay-delay", number>;
    centeredSlides: Attribute<"data-centered-slides", boolean>;
    freeMode: Attribute<"data-free-mode", boolean>;
    followFinger: Attribute<"data-follow-finger", boolean>;
    loop: Attribute<"data-loop", boolean>;
    mousewheel: Attribute<"data-mousewheel", boolean>;
    slidesPerView: Attribute<"data-slides-per-view", "auto" | number>;
    slideToClickedSlide: Attribute<"data-slide-to-clicked-slide", boolean>;
    spaceBetween: Attribute<"data-space-between", number>;
    speed: Attribute<"data-speed", number>;
}
export interface SliderSettings extends BaseSettings {
    options: SwiperOptions;
}
/**
 * A Swiper component wrapper for Webflow.
 *
 * @example
 * ```html
 * <!-- Swiper Component -->
 * <div
 *   data-swiper-id="my-swiper"
 *   data-swiper-element="component"
 *
 *   data-slides-per-view="auto"
 *   data-space-between="24"
 *   data-loop="true"
 *   data-autoplay="true"
 *   data-autoplay-delay="5000"
 * >
 *   <div data-swiper-element="wrapper" class="swiper-wrapper">
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
    static attr: import("../selector/attributes.js").AttributeAccessorMap<SwiperAttributes>;
    constructor(component: HTMLElement, settings: BaseSettings);
    protected static readonly attributeSelector: import("../selector/selector.js").AttributeSelector<string>;
    static selector: import("../selector/selector.js").InstanceSelector<SliderElement>;
    static select: <U extends Element = HTMLElement>(element: SliderElement, instance?: string) => U;
    static selectAll: <U extends Element = HTMLElement>(element: SliderElement, instance?: string) => NodeListOf<U>;
    private static create;
    static initAll(container?: HTMLElement, options?: SwiperOptions): void;
    static readOptions(swiperElement: HTMLElement, override?: SwiperOptions): SwiperOptions;
    static isEmpty(slider: HTMLElement): boolean;
    static hideEmptySlider(slider: HTMLElement): void;
    static updateCounter(swiper: Swiper, currentElement: HTMLElement, totalElement: HTMLElement): void;
    static initCounter(swiper: Swiper): void;
    static initSlides(wrapperEl: HTMLElement): void;
}
export {};
