var _a;
import gsap from "gsap";
import Selector from "../attributeselector";
import { BaseComponent } from "../base-component";
export class Cursor extends BaseComponent {
    constructor(cursor, settings) {
        super(cursor, settings);
        this.attr = _a.attr;
        this.el = cursor;
        this.el.setAttribute(this.attr.id, this.settings.id);
        this.el.setAttribute(this.attr.element, "pointer");
        this.addPointer(this.el);
        this.initTheme();
        this.initHover(this.el);
    }
    static get attributeSelector() {
        return Selector.attr(this.attr.element);
    }
    static create(settings) {
        const el = document.createElement("div");
        el.classList.add("cursor");
        document.body.appendChild(el);
        const cursor = new _a(el, settings);
        return cursor;
    }
    addPointer(pointer) {
        const xTo = gsap.quickSetter(pointer, "x", "px");
        const yTo = gsap.quickSetter(pointer, "y", "px");
        window.addEventListener("mousemove", (e) => {
            xTo(e.clientX);
            yTo(e.clientY);
        });
    }
    addTail(pointer, vars) {
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
        // Merge base styles with the specific state (hover/base) to ensure properties reset
        const vars = {
            ...defaultConfig[state],
            ...themeConfig[state],
            ...override,
            overwrite: "auto", // Prevents animation jitter
        };
        gsap.to(this.el, vars);
    }
    initTheme() {
        document.addEventListener("mouseover", (e) => {
            const target = e.target;
            if (!target)
                return;
            // Find the closest theme provider
            const themeKeys = Object.keys(this.settings.themes);
            const themeProvider = target.closest(`section, ${themeKeys.map((t) => `[data-cursor~="${t}"]`).join(", ")}`);
            const bgConfig = themeProvider?.getAttribute("data-cursor")?.split(" ") ?? [];
            const themeMatch = bgConfig.find((s) => themeKeys.includes(s));
            const nextTheme = themeMatch || this.settings.defaultTheme;
            if (nextTheme !== this.currentTheme) {
                //@ts-ignore
                this.currentTheme = nextTheme;
                this.applyState("base");
            }
        });
    }
    initHover(cursor) {
        const hoverTargets = document.querySelectorAll(`:is(${this.settings.selectors.hover}[data-cursor~="hover"]):not([data-cursor~="no-hover"])`);
        hoverTargets.forEach((target) => {
            const clickAnimation = () => {
                const tl = gsap.timeline();
                tl.to(cursor, {
                    scale: 1.25,
                    duration: 0.1,
                    ease: "power3.in",
                }).to(cursor, {
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
}
_a = Cursor;
Cursor.defaultSettings = {
    id: "",
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
};
Cursor.attr = {
    id: "data-cursor-id",
    element: "data-cursor-element",
};
// protected static readonly attributeSelector = Selector.attr<CursorElement>(Cursor.attr.element);
Cursor.selector = Selector.instance(_a.attributeSelector, _a.attr);
Cursor.select = Selector.select(_a.selector);
Cursor.selectAll = Selector.selectAll(_a.selector);
