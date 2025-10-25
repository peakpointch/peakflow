import Swiper from "swiper";
import type { SwiperOptions } from "swiper/types";
export declare function readSwiperOptions(swiperElement: HTMLElement): SwiperOptions;
export declare function initWebflowSwiper(swiperElement: HTMLElement): Swiper;
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
export declare function initWebflowSwipers(): void;
