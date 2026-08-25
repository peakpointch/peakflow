import { Selector, Dataset } from "../selector/index.js";

export interface DefaultScrollOptions {
  defaultOffset: number;
  defaultBehavior: ScrollBehavior;
}

export interface OverrideScrollOptions {
  offset: number;
  behavior: ScrollBehavior;
}

export const scrollDataset = Dataset.define({
  behavior: Dataset.String<ScrollBehavior, "data-scroll-behavior">("data-scroll-behavior"),
  prefix: Dataset.String("data-scroll-prefix"),
  href: Dataset.String("data-scroll-href"),
  to: Dataset.String("data-scroll-to"),
  offset: Dataset.Number("data-scroll-offset"),
  ignore: Dataset.Boolean("data-scroll-ignore"),
  global: Dataset.Boolean("data-scroll-global"),
});

export const defaultScrollOptions: DefaultScrollOptions = {
  defaultOffset: 0,
  defaultBehavior: "smooth",
};

export function scrollToSection(
  id: string,
  selectorType: "id" | "any" = "id",
  options: Partial<OverrideScrollOptions> = {},
): void {
  const opts: OverrideScrollOptions = {
    offset: options.offset ?? defaultScrollOptions.defaultOffset,
    behavior: options.behavior ?? defaultScrollOptions.defaultBehavior,
  };
  setTimeout(() => {
    id = id.trim();
    const selector = selectorType === "id" ? `#${id}` : id;
    if (!selector || selector === "#") {
      console.warn(`Scroll: "${selector}" is not a valid CSS selector.`);
      return;
    }
    const section = document.querySelector(selector);
    if (section) {
      const elementPosition = section.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - opts.offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: opts.behavior,
      });
    } else {
      console.error(`Section with id '${id}' not found.`);
    }
  }, 10);
}

export function onScrollClick(
  link: HTMLAnchorElement,
  options: Partial<DefaultScrollOptions> = {},
): void {
  const opts: DefaultScrollOptions = {
    defaultOffset: options.defaultOffset ?? defaultScrollOptions.defaultOffset,
    defaultBehavior: options.defaultBehavior ?? defaultScrollOptions.defaultBehavior,
  };
  if (!link) throw new Error(`Event target is undefined. Cannot scroll from an undefined link.`);

  const { behavior, href, offset } = Dataset.parse<typeof scrollDataset.definition>(link, {
    ...scrollDataset.definition,
    behavior: Dataset.String(scrollDataset.attr.behavior, opts.defaultBehavior),
    offset: Dataset.Number(scrollDataset.attr.offset, opts.defaultOffset),
  });

  const scrollId = link.getAttribute("href")?.trim().slice(1) || href.trim();
  if (!scrollId) return;

  scrollToSection(scrollId, "id", { offset, behavior });
}

export function initCMSScrollLinks(): void {
  const cmsScrollLinks = document.querySelectorAll<HTMLAnchorElement>(
    `a[${scrollDataset.attr.href}]`,
  );
  cmsScrollLinks.forEach((link) => {
    const { prefix, href } = scrollDataset.parse(link);
    link.href = `${prefix}#${href}`;
  });
}

export function initGlobalScrollLinks(): void {
  const globalScrollLinks = document.querySelectorAll<HTMLAnchorElement>(
    `a[${scrollDataset.attr.global}]`,
  );

  const globalFiltered = Array.from(globalScrollLinks).filter((link) => {
    const { global } = scrollDataset.parse(link);
    const url = new URL(link.href);
    const isSamePage = url.pathname === window.location.pathname;
    return global && isSamePage;
  });

  globalFiltered.forEach((link) => {
    const url = new URL(link.href);
    link.href = url.hash; // Set href to just the hash (e.g., "#section")
  });
}

export function disableWebflowScroll(): void {
  const Webflow = (window as any).Webflow || [];
  Webflow.push(() => {
    const $ = (window as any).$;
    if ($) {
      $(document).off("click");
    }
  });
}

export function overrideDefaultScroll(options: Partial<DefaultScrollOptions> = {}): void {
  initCMSScrollLinks();
  initGlobalScrollLinks();

  const href = Selector.attr("href");
  const scrollTo = Selector.attr(scrollDataset.attr.to);
  const allScrollLinks = document.querySelectorAll<HTMLAnchorElement>(
    [href("#", { matchType: "startsWith" }), scrollTo()].join(", "),
  );

  allScrollLinks.forEach((link) => {
    const { ignore } = scrollDataset.parse(link);
    if (ignore) return;

    link.addEventListener("click", (event) => {
      event.preventDefault();
      onScrollClick(link, options);
    });
  });
}

export function overrideWebflowScroll(options: Partial<DefaultScrollOptions> = {}): void {
  disableWebflowScroll();
  overrideDefaultScroll(options);
}
