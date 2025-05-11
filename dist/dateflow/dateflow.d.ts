import { Locale } from "date-fns";
type ElementsArg = Array<NodeListOf<HTMLElement> | HTMLElement | string>;
export declare function parseDateflow(element: HTMLElement): Date;
export declare function dateflow(locale: Locale, ...containers: ElementsArg): void;
export {};
