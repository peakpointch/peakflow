import gsap from "gsap";
import Selector from "../selector/index.js";
import { BaseComponent, type BaseSettings } from "../base-component/index.js";
import type { PartialOptions } from "../typeutils/index.js";
import { objectToCSS, breakpointsToMediaQueries } from "../utils/css.js";

export type CursorElement = "pointer";
export type CursorState = "base" | "hover";
export type CursorTheme = Record<CursorState, gsap.TweenVars>;

export interface CursorSettings<Theme extends string = string> extends BaseSettings {
  defaultTheme: Theme;
  themes: Record<Theme, CursorTheme>;
  selectors: {
    hover: string;
    click: string;
  };
  style: gsap.CSSVars;
  breakpoints: Record<number, gsap.CSSVars>;
  mobileFirst: boolean;
}

export class Cursor<T extends string> extends BaseComponent<CursorElement, CursorSettings> {
  public static readonly defaultSettings: CursorSettings = {
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

  public static readonly attr = {
    id: "data-cursor-id",
    element: "data-cursor-element",
  };
  public readonly attr = Cursor.attr;
  public currentTheme: T;
  public cursors: HTMLElement[] = [];
  public settings: CursorSettings<T>;

  constructor(cursor: HTMLElement, settings?: PartialOptions<CursorSettings<T>>) {
    super(cursor, settings as PartialOptions<CursorSettings>);

    this.currentTheme = this.settings.defaultTheme;

    this.addPointer(cursor);
    this.initTheme();
    this.initHover();
    this.injectStyles();
  }

  protected static readonly attributeSelector = Selector.attr<CursorElement>(this.attr.element);
  public static readonly selector = Selector.instance<CursorElement>(
    this.attributeSelector,
    this.attr,
  );
  public static readonly select = Selector.select<CursorElement>(this.selector);
  public static readonly selectAll = Selector.selectAll<CursorElement>(this.selector);

  public static create<T extends string>(settings: PartialOptions<CursorSettings<T>>): Cursor<T> {
    const el = document.createElement("div");
    document.body.appendChild(el);

    const cursor = new Cursor(el, settings);
    return cursor;
  }

  public addPointer(pointer: HTMLElement): void {
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

  public addTail(pointer: HTMLElement, vars: gsap.TweenVars): void {
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

  public applyState(state: CursorState, override: gsap.TweenVars = {}): void {
    const defaultConfig = this.settings.themes[this.settings.defaultTheme];
    const themeConfig = this.settings.themes[this.currentTheme];

    const vars: gsap.TweenVars = {
      ...defaultConfig[state],
      ...themeConfig[state],
      ...override,
      overwrite: "auto",
    };

    // Apply to all registered pointers/tails
    gsap.to(this.cursors, vars);
  }

  private initTheme(): void {
    document.addEventListener("mouseover", (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const themeKeys = Object.keys(this.settings.themes);
      const themeProvider = target.closest<HTMLElement>(
        `section, ${themeKeys.map((t) => `[data-cursor~="${t}"]`).join(", ")}`,
      );

      const bgConfig = themeProvider?.getAttribute("data-cursor")?.split(" ") ?? [];
      const themeMatch = bgConfig.find((s) => themeKeys.includes(s)) as T;

      const nextTheme = themeMatch || (this.settings.defaultTheme as T);

      if (nextTheme !== this.currentTheme) {
        this.currentTheme = nextTheme;
        this.applyState("base");
      }
    });
  }

  private initHover(): void {
    const hoverTargets = document.querySelectorAll(
      `:is(${this.settings.selectors.hover}[data-cursor~="hover"]):not([data-cursor~="no-hover"])`,
    );

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

  private injectStyles(): void {
    const pointerSelector = this.selector("pointer");
    const interactionSelector = `body, body *, button, a, a.button, .button, a.w-tab-link, .w-tab-link`;

    // Build the global stylesheet as one declarative object
    const styleSheet: Record<string, any> = {
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
      ...breakpointsToMediaQueries(
        this.settings.breakpoints,
        (styles) => {
          return {
            [pointerSelector]: {
              display: "block",
              ...styles,
            },
            [interactionSelector]: {
              cursor: this.settings.mobileFirst ? "none !important" : "auto",
            },
          };
        },
        { mobileFirst: this.settings.mobileFirst, unit: "px" },
      ),
    };

    const css = objectToCSS(styleSheet);

    // Injection Logic
    const styleId = `cursor-styles-${this.settings.id || "global"}`;
    if (document.getElementById(styleId)) return;

    if (window.CSSStyleSheet && (document as any).adoptedStyleSheets) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      (document as any).adoptedStyleSheets = [...(document as any).adoptedStyleSheets, sheet];
    } else {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = css;
      document.head.appendChild(style);
    }
  }
}
