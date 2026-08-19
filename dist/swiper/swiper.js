var _a;
import { Selector, Dataset } from "../selector/index.js";
import { Stylesheet } from "../utils/index.js";
import Swiper from "swiper";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { BaseComponent } from "../base-component/index.js";
const swiperDataset = Dataset.define({
    // Custom
    id: Dataset.String("data-swiper-id"),
    element: Dataset.String("data-swiper-element"),
    hide: Dataset.String("data-swiper-hide-options"),
    // Swiper
    allowTouchMove: Dataset.Boolean("data-allow-touch-move", true),
    autoHeight: Dataset.Boolean("data-auto-height"),
    autoplay: Dataset.Boolean("data-autoplay", true),
    autoplayDelay: Dataset.Number("data-autoplay-delay", 4000),
    centeredSlides: Dataset.Boolean("data-centered-slides", false),
    freeMode: Dataset.Boolean("data-free-mode", false),
    followFinger: Dataset.Boolean("data-follow-finger", false),
    loop: Dataset.Boolean("data-loop", true),
    mousewheel: Dataset.Boolean("data-mousewheel", false),
    slidesPerView: Dataset.NumberOrAuto("data-slides-per-view"),
    slideToClickedSlide: Dataset.Boolean("data-slide-to-clicked-slide", false),
    spaceBetween: Dataset.Number("data-space-between", 0),
    speed: Dataset.Number("data-speed", 400),
});
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
        _a.initSlides(swiperElement.querySelector(_a.selector("wrapper")));
        if (_a.isEmpty(swiperElement)) {
            _a.hideEmptySlider(swiperElement);
            return new Swiper(swiperElement);
        }
        const swiperOptions = this.readOptions(swiperElement, options);
        const swiper = new Swiper(swiperElement, swiperOptions);
        _a.initCounter(swiper);
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
        const settings = swiperDataset.parse(swiperElement);
        const swiperOptions = {
            autoplay: settings.autoplay
                ? {
                    delay: settings.autoplayDelay,
                    pauseOnMouseEnter: true,
                    disableOnInteraction: true,
                }
                : false,
            navigation: {
                prevEl: _a.selector("prev", settings.id),
                nextEl: _a.selector("next", settings.id),
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
    static isEmpty(slider) {
        const slides = slider.querySelectorAll(".swiper-slide");
        if (slides.length === 0) {
            console.warn(`Slider "${slider.getAttribute(_a.attr.id)}": Skip empty component.`);
            return true;
        }
        return false;
    }
    static hideEmptySlider(slider) {
        const sliderId = slider.getAttribute(_a.attr.id) || "";
        const hideOptions = slider.getAttribute(_a.attr.hide) || "hideNone";
        switch (hideOptions) {
            case "hideNone":
                break;
            case "hideComponent":
                slider.classList.add("hide");
                break;
            case "emptyState":
                const prevNextButtons = document.querySelectorAll(`[${_a.attr.id}="${sliderId}"] ${_a.selector("prev")}, [${_a.attr.id}="${sliderId}"] ${_a.selector("next")}`);
                Array.from(prevNextButtons).forEach((e) => e?.classList.add("hide"));
                break;
            default:
                break;
        }
    }
    static updateCounter(swiper, currentElement, totalElement) {
        const current = swiper.realIndex + 1;
        const total = swiper.slides.length;
        currentElement.textContent = current.toString();
        totalElement.textContent = total.toString();
    }
    static initCounter(swiper) {
        const currentElement = swiper.el.querySelector(_a.selector("counter-current"));
        const totalElement = swiper.el.querySelector(_a.selector("counter-total"));
        if (!currentElement || !totalElement)
            return;
        swiper.on("init", () => _a.updateCounter(swiper, currentElement, totalElement));
        swiper.on("slideChange", () => _a.updateCounter(swiper, currentElement, totalElement));
        _a.updateCounter(swiper, currentElement, totalElement);
    }
    static initSlides(wrapperEl) {
        Array.from(wrapperEl.children).forEach((el) => {
            el.classList.add("swiper-slide");
        });
    }
}
_a = Slider;
Slider.attr = swiperDataset.attr;
Slider.attributeSelector = Selector.attr(_a.attr.element);
Slider.selector = Selector.instance(_a.attributeSelector, _a.attr);
Slider.select = Selector.select(_a.selector);
Slider.selectAll = Selector.selectAll(_a.selector);
