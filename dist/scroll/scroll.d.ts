import { Dataset } from "../selector/index.js";
export interface DefaultScrollOptions {
    defaultOffset: number;
    defaultBehavior: ScrollBehavior;
}
export interface OverrideScrollOptions {
    offset: number;
    behavior: ScrollBehavior;
}
export declare const scrollDataset: Dataset<{
    behavior: import("../selector/attributes.js").DatasetAttribute<"data-scroll-behavior", ScrollBehavior>;
    prefix: import("../selector/attributes.js").DatasetAttribute<"data-scroll-prefix", string>;
    href: import("../selector/attributes.js").DatasetAttribute<"data-scroll-href", string>;
    to: import("../selector/attributes.js").DatasetAttribute<"data-scroll-to", string>;
    offset: import("../selector/attributes.js").DatasetAttribute<"data-scroll-offset", number>;
    ignore: import("../selector/attributes.js").DatasetAttribute<"data-scroll-ignore", boolean>;
    global: import("../selector/attributes.js").DatasetAttribute<"data-scroll-global", boolean>;
}>;
export declare const defaultScrollOptions: DefaultScrollOptions;
export declare function scrollToSection(id: string, selectorType?: "id" | "any", options?: Partial<OverrideScrollOptions>): void;
export declare function onScrollClick(link: HTMLAnchorElement, options?: Partial<DefaultScrollOptions>): void;
export declare function initCMSScrollLinks(): void;
export declare function initGlobalScrollLinks(): void;
export declare function disableWebflowScroll(): void;
export declare function overrideDefaultScroll(options?: Partial<DefaultScrollOptions>): void;
export declare function overrideWebflowScroll(options?: Partial<DefaultScrollOptions>): void;
