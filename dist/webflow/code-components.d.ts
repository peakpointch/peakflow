import type { CodeIslandProps, HTMLCodeIslandElement, WebflowCodeComponentsManifest } from "./code-component-types.js";
export declare function isCodeIslandUnparsed(element: Node): element is HTMLElement;
export declare function isCodeIsland<T extends CodeIslandProps = {}>(element: Node): element is HTMLCodeIslandElement<T>;
export declare function getCodeIslandManifest(island: HTMLCodeIslandElement): Promise<WebflowCodeComponentsManifest>;
export declare function awaitCodeIslandUpgrade(el: HTMLCodeIslandElement, timeout?: number): Promise<void>;
export declare function initCodeIsland(island: HTMLElement): Promise<HTMLCodeIslandElement>;
export declare function codeIslandRefresh(island: Element, newIsland: Element): Promise<HTMLCodeIslandElement>;
