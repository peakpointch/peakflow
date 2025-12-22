import gsap from "gsap";
import Selector from "../attributeselector";
import { BaseComponent, type BaseSettings } from "../base-component";
import type { PartialDeep } from "type-fest";

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
  };

  public static readonly attr = {
    id: "data-cursor-id",
    element: "data-cursor-element",
  };
  public readonly attr = Cursor.attr;
  public currentTheme: T;
  public cursors: HTMLElement[] = [];
  public settings: CursorSettings<T>;

  constructor(cursor: HTMLElement, settings?: PartialDeep<CursorSettings<T>>) {
    super(cursor, settings as PartialDeep<CursorSettings>);

    this.currentTheme = this.settings.defaultTheme;

    this.addPointer(cursor);
    this.initTheme();
    this.initHover();
  }

  protected static attributeSelector = Selector.attr<CursorElement>(this.attr.element);
  public static selector = Selector.instance<CursorElement>(this.attributeSelector, this.attr);
  public static select = Selector.select<CursorElement>(this.selector);
  public static selectAll = Selector.selectAll<CursorElement>(this.selector);

  public static create<T extends string>(settings: PartialDeep<CursorSettings<T>>): Cursor<T> {
    const el = document.createElement("div");
    el.classList.add("cursor");
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
}
