import { Selector, Dataset, type Attribute, type Attributes } from "../selector/index.js";
import { Stylesheet } from "../utils";
import type { CamelToDash, DashToCamelCase } from "../typeutils";

import Swiper from "swiper";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import type { AutoplayOptions, NavigationOptions, SwiperOptions } from "swiper/types";
import { BaseComponent, type BaseSettings } from "../base-component/index.js";

type SliderElement =
  | "component"
  | "wrapper"
  | "controls"
  | "navigation"
  | "pagination"
  | "prev"
  | "next"
  | "counter-current"
  | "counter-separator"
  | "counter-total";

type SliderHideOptions = "hideNone" | "hideComponent" | "emptyState";

type SliderAttribute =
  | "data-swiper-id"
  | "data-swiper-element"
  | "data-swiper-hide-options"
  | `data-${CamelToDash<keyof SwiperOptions>}`
  | `data-nav-${CamelToDash<keyof NavigationOptions>}`
  | `data-autoplay-${CamelToDash<keyof AutoplayOptions>}`;

type ToAttributeAccessor<T extends string> = T extends `data-swiper-${infer Tail}`
  ? DashToCamelCase<Tail>
  : T extends `data-${infer Tail}`
    ? DashToCamelCase<Tail>
    : DashToCamelCase<T>;

/* interface SwiperAttributes extends Attributes<ToAttributeAccessor<SliderAttribute>, SliderAttribute>*/
interface SwiperAttributes extends Attributes<string, SliderAttribute> {
  // Custom
  id: Attribute<"data-swiper-id", string>;
  element: Attribute<"data-swiper-element", SliderElement>;
  hide: Attribute<"data-swiper-hide-options", SliderHideOptions>;

  // Swiper
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

const swiperDataset = Dataset.define<SwiperAttributes>({
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
export class Slider extends BaseComponent<SliderElement> {
  public swiper: Swiper;
  public stylesheet: Stylesheet;
  public static attr = swiperDataset.attr;

  constructor(component: HTMLElement, settings: BaseSettings) {
    super(component, settings);
    this.stylesheet = new Stylesheet({
      href: "https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css",
    });

    this.stylesheet.load();
    Slider.create(this.component);
  }

  protected static readonly attributeSelector = Selector.attr(this.attr.element);
  public static readonly selector = Selector.instance<SliderElement>(
    this.attributeSelector,
    this.attr,
  );
  public static readonly select = Selector.select<SliderElement>(this.selector);
  public static readonly selectAll = Selector.selectAll<SliderElement>(this.selector);

  private static create(swiperElement: HTMLElement, options?: SwiperOptions): Swiper {
    Slider.initSlides(swiperElement.querySelector(Slider.selector("wrapper")));

    if (Slider.isEmpty(swiperElement)) {
      Slider.hideEmptySlider(swiperElement);
      return new Swiper(swiperElement);
    }

    const swiperOptions = this.readOptions(swiperElement, options);
    const swiper = new Swiper(swiperElement, swiperOptions);

    Slider.initCounter(swiper);

    if (swiperOptions.autoplay !== false) {
      swiper.autoplay.stop();
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              swiper.autoplay.start();
            } else {
              swiper.autoplay.stop();
            }
          });
        },
        {
          threshold: 0.2,
        },
      );

      observer.observe(swiperElement);
    }

    return swiper;
  }

  public static initAll(container: HTMLElement = document.body, options?: SwiperOptions): void {
    new Stylesheet({
      href: "https://cdn.jsdelivr.net/npm/swiper@12/swiper-bundle.min.css",
    }).load();

    // Remove all empty slides
    container.querySelectorAll(".w-slide:empty").forEach((e) => e.remove());

    const webflowSwipers = container.querySelectorAll<HTMLElement>(Slider.selector("component"));

    webflowSwipers.forEach((swiperElement: HTMLElement) => {
      Slider.create(swiperElement, options);
    });
  }

  public static readOptions(swiperElement: HTMLElement, override?: SwiperOptions): SwiperOptions {
    swiperElement.classList.remove("initial-hide");

    const settings = swiperDataset.parse(swiperElement);

    const swiperOptions: SwiperOptions = {
      autoplay: settings.autoplay
        ? {
            delay: settings.autoplayDelay,
            pauseOnMouseEnter: true,
            disableOnInteraction: true,
          }
        : false,
      navigation: {
        prevEl: Slider.selector("prev", settings.id),
        nextEl: Slider.selector("next", settings.id),
      },
      pagination: {
        el: Slider.selector("pagination"),
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

  public static isEmpty(slider: HTMLElement): boolean {
    const slides = slider.querySelectorAll<HTMLElement>(".swiper-slide");
    if (slides.length === 0) {
      console.warn(`Slider "${slider.getAttribute(Slider.attr.id)}": Skip empty component.`);
      return true;
    }
    return false;
  }

  public static hideEmptySlider(slider: HTMLElement): void {
    const sliderId = slider.getAttribute(Slider.attr.id) || "";

    const hideOptions: SliderHideOptions =
      (slider.getAttribute(Slider.attr.hide) as SliderHideOptions) || "hideNone";

    switch (hideOptions) {
      case "hideNone":
        break;
      case "hideComponent":
        slider.classList.add("hide");
        break;
      case "emptyState":
        const prevNextButtons = document.querySelectorAll(
          `[${Slider.attr.id}="${sliderId}"] ${Slider.selector("prev")}, [${Slider.attr.id}="${sliderId}"] ${Slider.selector("next")}`,
        );
        Array.from(prevNextButtons).forEach((e) => e?.classList.add("hide"));
        break;
      default:
        break;
    }
  }

  public static updateCounter(
    swiper: Swiper,
    currentElement: HTMLElement,
    totalElement: HTMLElement,
  ): void {
    const current = swiper.realIndex + 1;
    const total = swiper.slides.length;

    currentElement.textContent = current.toString();
    totalElement.textContent = total.toString();
  }

  public static initCounter(swiper: Swiper): void {
    const currentElement = swiper.el.querySelector<HTMLElement>(Slider.selector("counter-current"));
    const totalElement = swiper.el.querySelector<HTMLElement>(Slider.selector("counter-total"));

    if (!currentElement || !totalElement) return;

    swiper.on("init", () => Slider.updateCounter(swiper, currentElement, totalElement));
    swiper.on("slideChange", () => Slider.updateCounter(swiper, currentElement, totalElement));
    Slider.updateCounter(swiper, currentElement, totalElement);
  }

  public static initSlides(wrapperEl: HTMLElement): void {
    Array.from(wrapperEl.children).forEach((el) => {
      el.classList.add("swiper-slide");
    });
  }
}
