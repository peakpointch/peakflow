var _a;
import gsap from "gsap";
import Selector from "../attributeselector";
import { BaseComponent } from "../base-component";
import { objectToCSS, breakpointsToMediaQueries } from "../utils/css";
export class Cursor extends BaseComponent {
    constructor(cursor, settings) {
        super(cursor, settings);
        this.attr = _a.attr;
        this.cursors = [];
        this.currentTheme = this.settings.defaultTheme;
        this.addPointer(cursor);
        this.initTheme();
        this.initHover();
        this.injectStyles();
    }
    static create(settings) {
        const el = document.createElement("div");
        document.body.appendChild(el);
        const cursor = new _a(el, settings);
        return cursor;
    }
    addPointer(pointer) {
        pointer.setAttribute(this.attr.id, this.settings.id);
        pointer.setAttribute(this.attr.element, "pointer");
        this.cursors.push(pointer);
        const xTo = gsap.quickSetter(pointer, "x", "px");
        const yTo = gsap.quickSetter(pointer, "y", "px");
        window.addEventListener("mousemove", (e) => {
            xTo(e.clientX);
            yTo(e.clientY);
        });
    }
    addTail(pointer, vars) {
        pointer.setAttribute(this.attr.id, this.settings.id);
        pointer.setAttribute(this.attr.element, "pointer");
        this.cursors.push(pointer);
        const xTo = gsap.quickTo(pointer, "x", vars);
        const yTo = gsap.quickTo(pointer, "y", vars);
        window.addEventListener("mousemove", (e) => {
            xTo(e.clientX);
            yTo(e.clientY);
        });
    }
    applyState(state, override = {}) {
        const defaultConfig = this.settings.themes[this.settings.defaultTheme];
        const themeConfig = this.settings.themes[this.currentTheme];
        const vars = {
            ...defaultConfig[state],
            ...themeConfig[state],
            ...override,
            overwrite: "auto",
        };
        // Apply to all registered pointers/tails
        gsap.to(this.cursors, vars);
    }
    initTheme() {
        document.addEventListener("mouseover", (e) => {
            const target = e.target;
            if (!target)
                return;
            const themeKeys = Object.keys(this.settings.themes);
            const themeProvider = target.closest(`section, ${themeKeys.map((t) => `[data-cursor~="${t}"]`).join(", ")}`);
            const bgConfig = themeProvider?.getAttribute("data-cursor")?.split(" ") ?? [];
            const themeMatch = bgConfig.find((s) => themeKeys.includes(s));
            const nextTheme = themeMatch || this.settings.defaultTheme;
            if (nextTheme !== this.currentTheme) {
                this.currentTheme = nextTheme;
                this.applyState("base");
            }
        });
    }
    initHover() {
        const hoverTargets = document.querySelectorAll(`:is(${this.settings.selectors.hover}[data-cursor~="hover"]):not([data-cursor~="no-hover"])`);
        hoverTargets.forEach((target) => {
            const clickAnimation = () => {
                const tl = gsap.timeline();
                tl.to(this.cursors, {
                    scale: 1.25,
                    duration: 0.1,
                    ease: "power3.in",
                }).to(this.cursors, {
                    scale: 2,
                    duration: 0.2,
                    ease: "back.out(2.5)",
                });
            };
            target.addEventListener("mouseenter", () => {
                this.applyState("hover");
                target.addEventListener("click", clickAnimation);
            });
            target.addEventListener("mouseleave", () => {
                this.applyState("base");
                target.removeEventListener("click", clickAnimation);
            });
        });
    }
    injectStyles() {
        const pointerSelector = this.selector("pointer");
        const interactionSelector = `body, body *, button, a, a.button, .button, a.w-tab-link, .w-tab-link`;
        // Build the global stylesheet as one declarative object
        const styleSheet = {
            [pointerSelector]: {
                display: "none",
                pointerEvents: "none",
                position: "fixed",
                top: 0,
                left: 0,
                zIndex: 9999,
                ...this.settings.style,
            },
            // Initial native cursor state
            [interactionSelector]: {
                cursor: this.settings.mobileFirst ? "auto" : "none",
            },
            // Add media queries
            ...breakpointsToMediaQueries(this.settings.breakpoints, (styles) => {
                return {
                    [pointerSelector]: {
                        display: "block",
                        ...styles,
                    },
                    [interactionSelector]: {
                        cursor: this.settings.mobileFirst ? "none !important" : "auto",
                    },
                };
            }, { mobileFirst: this.settings.mobileFirst, unit: "px" }),
        };
        // Add media queries declaratively
        const css = objectToCSS(styleSheet, { pretty: true });
        console.log("CSS", css);
        // Injection Logic
        const styleId = `cursor-styles-${this.settings.id || "global"}`;
        if (document.getElementById(styleId))
            return;
        if (window.CSSStyleSheet && document.adoptedStyleSheets) {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(css);
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
        }
        else {
            const style = document.createElement("style");
            style.id = styleId;
            style.textContent = css;
            document.head.appendChild(style);
        }
    }
}
_a = Cursor;
Cursor.defaultSettings = {
    id: undefined,
    defaultTheme: "dark",
    themes: {
        light: {
            base: {},
            hover: {},
        },
    },
    selectors: {
        hover: "a, button, input, select, textarea",
        click: "a, button, input, select, textarea",
    },
    style: {
        display: "none",
    },
    breakpoints: {
        992: {
            display: "block",
        },
    },
    mobileFirst: true,
};
Cursor.attr = {
    id: "data-cursor-id",
    element: "data-cursor-element",
};
Cursor.attributeSelector = Selector.attr(_a.attr.element);
Cursor.selector = Selector.instance(_a.attributeSelector, _a.attr);
Cursor.select = Selector.select(_a.selector);
Cursor.selectAll = Selector.selectAll(_a.selector);
