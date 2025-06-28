import createAttribute from "../attributeselector/index.js";
export const defaultScrollOptions = {
    defaultOffset: 0,
    defaultBehaviour: 'smooth'
};
export function scrollToSection(id, selectorType = "id", options = {}) {
    const opts = {
        offset: options.offset ?? defaultScrollOptions.defaultOffset,
        behaviour: options.behaviour ?? defaultScrollOptions.defaultBehaviour
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
        }
        else {
            console.error(`Section with id '${id}' not found.`);
        }
    }, 10);
}
export function onScroll(event, options = {}) {
    event.preventDefault();
    const opts = {
        defaultOffset: options.defaultOffset ?? defaultScrollOptions.defaultOffset,
        defaultBehaviour: options.defaultBehaviour ?? defaultScrollOptions.defaultBehaviour,
    };
    const link = event.target;
    if (!link)
        throw new Error(`Event target is undefined. Cannot scroll from an undefined link.`);
    const scrollId = link.getAttribute("href")?.slice(1) ||
        link.getAttribute("scroll-to") ||
        "";
    const offset = parseInt(link.getAttribute("scroll-offset") || `${opts.defaultOffset}`, 10);
    const behaviour = link.getAttribute("scroll-behaviour") || opts.defaultBehaviour;
    scrollToSection(scrollId, 'id', { offset, behaviour });
}
export function initCMSScrollLinks() {
    const cmsScrollLinks = document.querySelectorAll("a[data-href-scroll]");
    cmsScrollLinks.forEach((link) => {
        const hrefPrefix = link.dataset.hrefPrefix || "";
        const hrefScroll = link.dataset.hrefScroll || "";
        link.href = `${hrefPrefix}#${hrefScroll}`;
    });
}
export function initGlobalScrollLinks() {
    const globalScrollLinks = document.querySelectorAll('a[data-global-scroll="true"]');
    const globalFiltered = Array.from(globalScrollLinks).filter((link) => {
        const url = new URL(link.href);
        return url.pathname === location.pathname;
    });
    globalFiltered.forEach((link) => {
        const url = new URL(link.href);
        link.href = url.hash; // Set href to just the hash (e.g., "#section")
    });
}
export function disableWebflowScroll() {
    //@ts-ignore
    var Webflow = window.Webflow || [];
    Webflow.push(function () {
        $(function () {
            $(document).off('click.wf-scroll');
        });
    });
}
export function overrideDefaultScroll(options = {}) {
    initCMSScrollLinks();
    initGlobalScrollLinks();
    const href = createAttribute('href');
    const allScrollLinks = document.querySelectorAll(`${href('#', { matchType: 'startsWith' })}, [scroll-to]`);
    allScrollLinks.forEach((link) => {
        link.addEventListener("click", (event) => onScroll(event, options));
    });
}
export function overrideWebflowScroll(options = {}) {
    disableWebflowScroll();
    overrideDefaultScroll(options);
}
