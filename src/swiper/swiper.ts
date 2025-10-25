import { createAttribute } from "../attributeselector/index.js";
import { Stylesheet, toCamelCase } from "../utils";
import type { CamelToDash } from "../typeutils";

import Swiper from "swiper";
import { Autoplay, Navigation, Pagination, Manipulation } from "swiper/modules";
import type { AutoplayOptions, NavigationOptions, SwiperOptions } from "swiper/types";

interface SwiperAttribute {
  name:
    | "data-swiper-element"
    | "data-swiper-id"
    | `data-${CamelToDash<keyof SwiperOptions>}`
    | `data-nav-${CamelToDash<keyof NavigationOptions>}`
    | `data-autoplay-${CamelToDash<keyof AutoplayOptions>}`;
  type: "string" | "boolean" | "float" | "floatOrAuto";
  default?: string | boolean | number;
}

interface CustomSwiperOptions {
  allowTouchMove: boolean;
  autoHeight: boolean;
  autoplay: boolean;
  autoplayDelay: number;
  centeredSlides: boolean;
  freeMode: boolean;
  followFinger: boolean;
  id: string;
  loop: boolean;
  mousewheel: boolean;
  slidesPerView: "auto" | number;
  slideToClickedSlide: boolean;
  spaceBetween: number;
  speed: number;
}

type SwiperHideOptions = "hideNone" | "hideComponent" | "emptyState";
type SwiperElement =
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

const swiperSelector = createAttribute<SwiperElement>("data-swiper-element");

function getKeyFromAttributeName(name: string): string {
  if (name.startsWith("data-swiper-")) {
    return toCamelCase(name.replace("data-swiper-", ""));
  } else if (name.startsWith("data-")) {
    return toCamelCase(name.replace("data-", ""));
  } else {
    return toCamelCase(name);
  }
}

function swiperEmpty(swiperElement: HTMLElement): boolean {
  const slides = swiperElement.querySelectorAll<HTMLElement>(".swiper-slide");
  if (slides.length === 0) {
    console.warn(`Swiper "${swiperElement.getAttribute("data-swiper-id")}": Skip empty component.`);
    return true;
  }
  return false;
}

function hideEmptySwiper(swiperElement: HTMLElement): void {
  const swiperId = swiperElement.getAttribute(`data-swiper-id`) || "";
  const swiperMode = swiperElement.dataset.swiperMode || "";

  const hideOptions: SwiperHideOptions =
    (swiperElement.dataset.swiperHideOptions as SwiperHideOptions) || "hideNone";

  switch (hideOptions) {
    case "hideNone":
      break;
    case "hideComponent":
      swiperElement.classList.add("hide");
      break;
    case "emptyState":
      const prevNextButtons = document.querySelectorAll(
        `[data-swiper-id="${swiperId}"] ${swiperSelector("prev")}, [data-swiper-id="${swiperId}"] ${swiperSelector("next")}`,
      );
      Array.from(prevNextButtons).forEach((e) => e?.classList.add("hide"));
      break;
    default:
      break;
  }
}

function parseSwiperOptions(
  container: HTMLElement,
  attributes: SwiperAttribute[],
): CustomSwiperOptions {
  const settings: Partial<CustomSwiperOptions> = {};
  attributes.forEach((attribute) => {
    const key = getKeyFromAttributeName(attribute.name);
    const value = container.getAttribute(attribute.name);

    switch (attribute.type) {
      case "string":
        settings[key] = value || attribute.default || "";
        break;
      case "boolean":
        if (value !== "false" && value !== "true" && attribute.default === undefined) {
          throw new Error(`Attribute "${attribute.name}" is not a boolean.`);
        }
        settings[key] = JSON.parse(value || attribute.default?.toString() || "{}") ?? undefined;
        break;
      case "float":
        const float = parseFloat(value || attribute.default?.toString() || "");
        if (isNaN(float)) {
          console.warn("TypeError: Failed to parse attribute value as float.");
          settings[key] = undefined;
        } else {
          settings[key] = float;
        }
        break;
      case "floatOrAuto":
        settings[key] = value === "auto" ? "auto" : parseFloat(value || "") || "auto";
        break;
      default:
        settings[key] = value || attribute.default || "";
        break;
    }
  });
  return settings as CustomSwiperOptions;
}

export function readSwiperOptions(swiperElement: HTMLElement): SwiperOptions {
  swiperElement.classList.remove("initial-hide");

  /**
   * REMINDER: If this changes, `CustomSwiperOptions` has to be updated as well
   */
  const swiperAttributes: SwiperAttribute[] = [
    { name: "data-swiper-id", type: "string" },
    { name: "data-mousewheel", type: "boolean", default: false },
    { name: "data-free-mode", type: "boolean", default: false },
    { name: "data-follow-finger", type: "boolean", default: false },
    { name: "data-auto-height", type: "boolean", default: false },
    { name: "data-slides-per-view", type: "floatOrAuto" },
    { name: "data-slide-to-clicked-slide", type: "boolean", default: false },
    { name: "data-space-between", type: "float", default: 8 },
    { name: "data-centered-slides", type: "boolean", default: false },
    { name: "data-loop", type: "boolean", default: true },
    { name: "data-allow-touch-move", type: "boolean", default: true },
    { name: "data-autoplay", type: "boolean", default: true },
    { name: "data-autoplay-delay", type: "float", default: 4000 },
    { name: "data-speed", type: "float", default: 400 },
  ];

  const settings = parseSwiperOptions(swiperElement, swiperAttributes);

  const swiperOptions: SwiperOptions = {
    autoplay: {
      delay: settings.autoplay ? settings.autoplayDelay : undefined,
      pauseOnMouseEnter: true,
      disableOnInteraction: true,
    },
    navigation: {
      prevEl: `[data-swiper-id="${settings.id}"] ${swiperSelector("prev")}`,
      nextEl: `[data-swiper-id="${settings.id}"] ${swiperSelector("next")}`,
    },
    pagination: {
      el: swiperSelector("pagination"),
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

  return swiperOptions;
}

function updateCounter(
  swiper: Swiper,
  currentElement: HTMLElement,
  totalElement: HTMLElement,
): void {
  const current = swiper.realIndex + 1;
  const total = swiper.slides.length;

  currentElement.textContent = current.toString();
  totalElement.textContent = total.toString();
}

function initCounter(swiper: Swiper): void {
  const currentElement = swiper.el.querySelector<HTMLElement>(swiperSelector("counter-current"));
  const totalElement = swiper.el.querySelector<HTMLElement>(swiperSelector("counter-total"));

  if (!currentElement || !totalElement) return;

  swiper.on("init", () => updateCounter(swiper, currentElement, totalElement));
  swiper.on("slideChange", () => updateCounter(swiper, currentElement, totalElement));
  updateCounter(swiper, currentElement, totalElement);
}

function initSwiperSlides(wrapperEl: HTMLElement): void {
  Array.from(wrapperEl.children).forEach((el) => {
    el.classList.add("swiper-slide");
  });
}

export function initWebflowSwiper(swiperElement: HTMLElement): Swiper {
  initSwiperSlides(swiperElement.querySelector(swiperSelector("wrapper")));

  if (swiperEmpty(swiperElement)) {
    hideEmptySwiper(swiperElement);
    return new Swiper(swiperElement);
  }

  const swiperOptions = readSwiperOptions(swiperElement);
  const swiper = new Swiper(swiperElement, swiperOptions);

  initCounter(swiper);

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
export function initWebflowSwipers() {
  new Stylesheet({
    href: "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css",
  }).load();

  // Remove all empty slides
  document.querySelectorAll(".w-slide:empty").forEach((e) => e.remove());

  const webflowSwipers = document.querySelectorAll<HTMLElement>(swiperSelector("component"));

  webflowSwipers.forEach((swiperElement: HTMLElement) => {
    initWebflowSwiper(swiperElement);
  });
}
