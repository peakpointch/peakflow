var _a;
import { Selector } from "../selector/index.js";
import { Stylesheet, parseDataset } from "../utils";
import Swiper from "swiper";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { BaseComponent } from "../base-component/index.js";
/**
 * REMINDER: If this changes, `SwiperDataset` has to be updated as well
 */
const swiperAttributes = [
    { name: "data-swiper-id", type: "string" },
    { name: "data-mousewheel", type: "boolean", default: false },
    { name: "data-free-mode", type: "boolean", default: false },
    { name: "data-follow-finger", type: "boolean", default: false },
    { name: "data-auto-height", type: "boolean", default: false },
    { name: "data-slides-per-view", type: "numberOrAuto" },
    { name: "data-slide-to-clicked-slide", type: "boolean", default: false },
    { name: "data-space-between", type: "number", default: 0 },
    { name: "data-centered-slides", type: "boolean", default: false },
    { name: "data-loop", type: "boolean", default: true },
    { name: "data-allow-touch-move", type: "boolean", default: true },
    { name: "data-autoplay", type: "boolean", default: true },
    { name: "data-autoplay-delay", type: "number", default: 4000 },
    { name: "data-speed", type: "number", default: 400 },
];
function sliderEmpty(slider) {
    const slides = slider.querySelectorAll(".swiper-slide");
    if (slides.length === 0) {
        console.warn(`Slider "${slider.getAttribute(Slider.attr.id)}": Skip empty component.`);
        return true;
    }
    return false;
}
function hideEmptySlider(slider) {
    const sliderId = slider.getAttribute(Slider.attr.id) || "";
    const hideOptions = slider.getAttribute(Slider.attr.hide) || "hideNone";
    switch (hideOptions) {
        case "hideNone":
            break;
        case "hideComponent":
            slider.classList.add("hide");
            break;
        case "emptyState":
            const prevNextButtons = document.querySelectorAll(`[${Slider.attr.id}="${sliderId}"] ${Slider.selector("prev")}, [${Slider.attr.id}="${sliderId}"] ${Slider.selector("next")}`);
            Array.from(prevNextButtons).forEach((e) => e?.classList.add("hide"));
            break;
        default:
            break;
    }
}
function updateCounter(swiper, currentElement, totalElement) {
    const current = swiper.realIndex + 1;
    const total = swiper.slides.length;
    currentElement.textContent = current.toString();
    totalElement.textContent = total.toString();
}
function initCounter(swiper) {
    const currentElement = swiper.el.querySelector(Slider.selector("counter-current"));
    const totalElement = swiper.el.querySelector(Slider.selector("counter-total"));
    if (!currentElement || !totalElement)
        return;
    swiper.on("init", () => updateCounter(swiper, currentElement, totalElement));
    swiper.on("slideChange", () => updateCounter(swiper, currentElement, totalElement));
    updateCounter(swiper, currentElement, totalElement);
}
function initSlides(wrapperEl) {
    Array.from(wrapperEl.children).forEach((el) => {
        el.classList.add("swiper-slide");
    });
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
export class Slider extends BaseComponent {
    constructor(component, settings) {
        super(component, settings);
        this.stylesheet = new Stylesheet({
            href: "https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css",
        });
        this.stylesheet.load();
        _a.create(this.component);
    }
    static create(swiperElement, options) {
        initSlides(swiperElement.querySelector(_a.selector("wrapper")));
        if (sliderEmpty(swiperElement)) {
            hideEmptySlider(swiperElement);
            return new Swiper(swiperElement);
        }
        const swiperOptions = this.readOptions(swiperElement, options);
        const swiper = new Swiper(swiperElement, swiperOptions);
        initCounter(swiper);
        if (swiperOptions.autoplay !== false) {
            swiper.autoplay.stop();
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        swiper.autoplay.start();
                    }
                    else {
                        swiper.autoplay.stop();
                    }
                });
            }, {
                threshold: 0.2,
            });
            observer.observe(swiperElement);
        }
        return swiper;
    }
    static initAll(container = document.body, options) {
        new Stylesheet({
            href: "https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css",
        }).load();
        // Remove all empty slides
        container.querySelectorAll(".w-slide:empty").forEach((e) => e.remove());
        const webflowSwipers = container.querySelectorAll(_a.selector("component"));
        webflowSwipers.forEach((swiperElement) => {
            _a.create(swiperElement, options);
        });
    }
    static readOptions(swiperElement, override) {
        swiperElement.classList.remove("initial-hide");
        const settings = parseDataset(swiperElement, swiperAttributes);
        const swiperOptions = {
            autoplay: settings.autoplay
                ? {
                    delay: settings.autoplayDelay,
                    pauseOnMouseEnter: true,
                    disableOnInteraction: true,
                }
                : false,
            navigation: {
                prevEl: _a.selector("prev", settings.swiperId),
                nextEl: _a.selector("next", settings.swiperId),
            },
            pagination: {
                el: _a.selector("pagination"),
                bulletElement: "button",
                bulletClass: "swiper-bullet",
                bulletActiveClass: "is-active",
                clickable: true,
            },
            breakpoints: {
                991: {
                    slidesPerView: settings.slidesPerView,
                },
            },
            keyboard: {
                enabled: true,
                onlyInViewport: true,
            },
            mousewheel: {
                enabled: settings.mousewheel,
                forceToAxis: true,
            },
            allowTouchMove: settings.allowTouchMove,
            autoHeight: settings.autoHeight,
            centeredSlides: settings.centeredSlides,
            effect: "slide",
            followFinger: settings.followFinger,
            freeMode: settings.freeMode,
            loop: settings.loop,
            slideActiveClass: "is-active",
            slidesPerView: "auto",
            slideToClickedSlide: settings.slideToClickedSlide,
            spaceBetween: settings.spaceBetween,
            speed: settings.speed,
            modules: [Autoplay, Navigation, Pagination],
        };
        const safeOverride = override || {};
        const merged = {
            ...swiperOptions,
            ...safeOverride,
        };
        return merged;
    }
}
_a = Slider;
Slider.attr = {
    id: "data-swiper-id",
    element: "data-swiper-element",
    hide: "data-swiper-hide-options",
};
Slider.attributeSelector = Selector.attr(_a.attr.element);
Slider.selector = Selector.instance(_a.attributeSelector, _a.attr);
Slider.select = Selector.select(_a.selector);
Slider.selectAll = Selector.selectAll(_a.selector);
