export type MarqueeElement = 'component' | 'track' | 'button';
export declare const marqueeSelector: import("../attributeselector/attributeselector.js").AttributeSelector<MarqueeElement>;
export declare function setMarqueeSpeed(speed: number | 'auto', trackOrComponent: HTMLElement): number;
export declare function isComponentElement(element: HTMLElement): element is HTMLElement;
export declare function getTrackElement(trackOrComponent: HTMLElement): HTMLElement;
export declare function getButtonElement<T extends HTMLElement = HTMLElement>(marquee: HTMLElement): T | undefined;
export declare function initMarqueeEvents(marquee: HTMLElement): void;
export declare function initializeMarquees(main: HTMLElement): void;
