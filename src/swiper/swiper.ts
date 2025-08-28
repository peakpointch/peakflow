import Swiper from "swiper";
import { Autoplay, Navigation, Pagination, Manipulation } from "swiper/modules";
import { toCamelCase } from "../utils";
import type { AutoplayOptions, NavigationOptions, SwiperOptions } from "swiper/types";
import type { CamelToDash } from "../typeutils";
import { createAttribute } from "../attributeselector/index.js";

interface SwiperAttribute {
  name:
    | "swiper-component"
    | "data-swiper-nav"
    | "data-swiper-mode"
    | `data-swiper-${CamelToDash<keyof SwiperOptions>}`
    | `data-swiper-nav-${CamelToDash<keyof NavigationOptions>}`
    | `data-swiper-autoplay-${CamelToDash<keyof AutoplayOptions>}`;
  type: "string" | "boolean" | "float" | "floatOrAuto";
  default?: string | boolean | number;
}

interface CustomSwiperOptions {
  swiperComponent: string;
  mode: string;
  nav: string;
  autoHeight: boolean;
  slidesPerView: "auto" | number;
  spaceBetween: number;
  centeredSlides: boolean;
  loop: boolean;
  allowTouchMove: boolean;
  autoplay: boolean;
  autoplayDelay: number;
  speed: number;
}

type SwiperHideOptions = "hideNone" | "hideComponent" | "emptyState";
type SwiperElement = "counter-current" | "counter-separator" | "counter-total";
const swiperSelector = createAttribute<SwiperElement>("data-swiper-element");

function swiperEmpty(swiperElement: HTMLElement): boolean {
  const slides = swiperElement.querySelectorAll<HTMLElement>(".swiper-slide");
  if (slides.length === 0) {
    console.warn(
      `Swiper "${swiperElement.getAttribute("swiper-component")}": Skip empty component.`,
    );
    return true;
  }
  return false;
}

function hideEmptySwiper(swiperElement: HTMLElement): void {
  const swiperId = swiperElement.getAttribute("swiper-component") || "";
  const swiperMode = swiperElement.dataset.swiperMode || "";
  const navigationPrefix = setNavigationPrefix(swiperId, swiperMode);

  const dataNav = (swiperElement.dataset.swiperNav || ".swiper-button").toString();
  const prevSelector = `${navigationPrefix}${dataNav}:not(.next)`;
  const nextSelector = `${navigationPrefix}${dataNav}.next`;

  const hideOptions: SwiperHideOptions =
    (swiperElement.dataset.swiperHideOptions as SwiperHideOptions) || "hideNone";

  switch (hideOptions) {
    case "hideNone":
      break;
    case "hideComponent":
      swiperElement.classList.add("hide");
      break;
    case "emptyState":
      const prevEl = navigationPrefix
        ? swiperElement.querySelector(prevSelector)
        : document.querySelector(prevSelector);
      const nextEl = navigationPrefix
        ? swiperElement.querySelector(nextSelector)
        : document.querySelector(nextSelector);
      [prevEl, nextEl].forEach((e) => e?.classList.add("hide"));
      break;
    default:
      break;
  }
}

function setNavigationPrefix(swiperId: string, swiperMode: string): string {
  let navigationPrefix = "";
  if (swiperMode === "cms") {
    navigationPrefix = `[swiper-navigation-for="${swiperId}"] `; // This space is mandatory
    if (!swiperId) throw new Error(`Swiper: Please provide a swiper id`);
  }
  return navigationPrefix;
}

function parseSlidesPerView(value: string): number | "auto" {
  return value === "auto" ? "auto" : parseFloat(value) || "auto";
}

function setupAutoplay(enabled: boolean, delay = 4000): boolean | AutoplayOptions {
  if (!enabled) {
    return false;
  }

  return {
    delay: delay,
    pauseOnMouseEnter: true,
    disableOnInteraction: true,
  } as AutoplayOptions;
}

function getKeyFromAttributeName(name: string): string {
  if (name.startsWith("data-swiper-")) {
    return toCamelCase(name.replace("data-swiper-", ""));
  } else if (name.startsWith("data-")) {
    return toCamelCase(name.replace("data-", ""));
  } else {
    return toCamelCase(name);
  }
}

function parseSwiperOptions(
  container: HTMLElement,
  attributes: SwiperAttribute[],
): CustomSwiperOptions {
  const settings: Partial<CustomSwiperOptions> = {};
  attributes.forEach((attribute, index) => {
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
    { name: "swiper-component", type: "string" },
    { name: "data-swiper-mode", type: "string" },
    { name: "data-swiper-nav", type: "string", default: ".swiper-button" },
    { name: "data-swiper-auto-height", type: "boolean", default: false },
    { name: "data-swiper-slides-per-view", type: "floatOrAuto" },
    { name: "data-swiper-space-between", type: "float", default: 8 },
    { name: "data-swiper-centered-slides", type: "boolean", default: false },
    { name: "data-swiper-loop", type: "boolean", default: true },
    { name: "data-swiper-allow-touch-move", type: "boolean", default: true },
    { name: "data-swiper-autoplay", type: "boolean", default: true },
    { name: "data-swiper-autoplay-delay", type: "float", default: 4000 },
    { name: "data-swiper-speed", type: "float", default: 400 },
  ];

  const settings = parseSwiperOptions(swiperElement, swiperAttributes);

  const navigationPrefix = setNavigationPrefix(settings.swiperComponent, settings.mode);
  const prevEl = `${navigationPrefix}${settings.nav}:not(.next)`;
  const nextEl = `${navigationPrefix}${settings.nav}.next`;
  const autoplayOptions = setupAutoplay(settings.autoplay, settings.autoplayDelay);

  const swiperOptions: SwiperOptions = {
    navigation: {
      prevEl: prevEl,
      nextEl: nextEl,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      991: {
        slidesPerView: settings.slidesPerView,
      },
    },
    autoplay: autoplayOptions,
    allowTouchMove: settings.allowTouchMove,
    centeredSlides: settings.centeredSlides,
    effect: "slide",
    speed: settings.speed,
    autoHeight: settings.autoHeight,
    spaceBetween: settings.spaceBetween,
    loop: settings.loop,
    slidesPerView: "auto",
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

export function initWebflowSwiper(swiperElement: HTMLElement): Swiper {
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

export function initWebflowSwipers() {
  // Remove all empty slides
  document.querySelectorAll(".w-slide:empty").forEach((e) => e.remove());

  const webflowSwipers = document.querySelectorAll<HTMLElement>(
    '[swiper-component]:not([swiper-component="default"])',
  );

  webflowSwipers.forEach((swiperElement: HTMLElement) => {
    initWebflowSwiper(swiperElement);
  });
}

export function initDefaultSwipers() {
  const defaultSwipers = document.querySelectorAll<HTMLElement>(`[default-swiper-component]`);

  defaultSwipers.forEach((swiperElement) => {
    if (swiperEmpty(swiperElement)) return;
    swiperElement.classList.remove("initial-hide");

    const swiperId = swiperElement.getAttribute("default-swiper-component") || "";
    const swiperMode = swiperElement.dataset.swiperMode || "";
    const navigationPrefix = setNavigationPrefix(swiperId, swiperMode);

    const swiper = new Swiper(swiperElement, {
      navigation: {
        prevEl: `${navigationPrefix}.swiper-button-static:not(.next)`,
        nextEl: `${navigationPrefix}.swiper-button-static.next`,
      },
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      allowTouchMove: true,
      spaceBetween: 24,
      speed: 400,
      loop: true,
      slidesPerView: "auto",
      modules: [Autoplay, Navigation, Pagination],
    });
  });
}
