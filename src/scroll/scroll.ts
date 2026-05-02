import Selector from "../selector/index.js";

export interface DefaultScrollOptions {
  defaultOffset: number;
  defaultBehaviour: ScrollBehavior;
}

export interface OverrideScrollOptions {
  offset: number;
  behaviour: ScrollBehavior;
}

export const defaultScrollOptions: DefaultScrollOptions = {
  defaultOffset: 0,
  defaultBehaviour: "smooth",
};

export function scrollToSection(
  id: string,
  selectorType: "id" | "any" = "id",
  options: Partial<OverrideScrollOptions> = {},
): void {
  const opts: OverrideScrollOptions = {
    offset: options.offset ?? defaultScrollOptions.defaultOffset,
    behaviour: options.behaviour ?? defaultScrollOptions.defaultBehaviour,
  };
  setTimeout(() => {
    const selector = selectorType === "id" ? `#${id}` : id;
    const section = document.querySelector(selector);
    if (section) {
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - opts.offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: opts.behaviour,
      });
    } else {
      console.error(`Section with id '${id}' not found.`);
    }
  }, 10);
}

export function onScroll(
  link: HTMLAnchorElement,
  event: Event,
  options: Partial<DefaultScrollOptions> = {},
): void {
  event.preventDefault();
  const opts: DefaultScrollOptions = {
    defaultOffset: options.defaultOffset ?? defaultScrollOptions.defaultOffset,
    defaultBehaviour: options.defaultBehaviour ?? defaultScrollOptions.defaultBehaviour,
  };
  if (!link) throw new Error(`Event target is undefined. Cannot scroll from an undefined link.`);
  const scrollId = link.getAttribute("href")?.slice(1) || link.getAttribute("scroll-to") || "";

  const offset = parseInt(link.getAttribute("scroll-offset") || `${opts.defaultOffset}`, 10);
  const behaviour =
    (link.getAttribute("scroll-behaviour") as ScrollBehavior) || opts.defaultBehaviour;
  scrollToSection(scrollId, "id", { offset, behaviour });
}

export function initCMSScrollLinks(): void {
  const cmsScrollLinks = document.querySelectorAll<HTMLAnchorElement>("a[data-href-scroll]");
  cmsScrollLinks.forEach((link) => {
    const hrefPrefix = link.dataset.hrefPrefix || "";
    const hrefScroll = link.dataset.hrefScroll || "";
    link.href = `${hrefPrefix}#${hrefScroll}`;
  });
}

export function initGlobalScrollLinks(): void {
  const globalScrollLinks = document.querySelectorAll<HTMLAnchorElement>(
    'a[data-global-scroll="true"]',
  );

  const globalFiltered = Array.from(globalScrollLinks).filter((link) => {
    const url = new URL(link.href);
    return url.pathname === location.pathname;
  });

  globalFiltered.forEach((link) => {
    const url = new URL(link.href);
    link.href = url.hash; // Set href to just the hash (e.g., "#section")
  });
}

export function disableWebflowScroll(): void {
  const Webflow = (window as any).Webflow || [];
  Webflow.push(() => {
    document.removeEventListener("click", (window as any).Webflow?.scroll, true);
  });
}

export function overrideDefaultScroll(options: Partial<DefaultScrollOptions> = {}): void {
  initCMSScrollLinks();
  initGlobalScrollLinks();

  const href = Selector.attr("href");
  const allScrollLinks = document.querySelectorAll<HTMLAnchorElement>(
    `${href("#", { matchType: "startsWith" })}, [scroll-to]`,
  );

  allScrollLinks.forEach((link) => {
    link.addEventListener("click", (event) => onScroll(link, event, options));
  });
}

export function overrideWebflowScroll(options: Partial<DefaultScrollOptions> = {}): void {
  disableWebflowScroll();
  overrideDefaultScroll(options);
}
