import type { PartialDeep } from "type-fest";
import Renderer from "../renderer/index.js";
import type { FilterAttributes, RenderData, RendererOptions } from "../renderer/index.js";
type GlobalWfCollections = {
    initialized: boolean;
    [key: string]: GlobalCollection | CollectionList | boolean;
};
type GlobalCollection = Array<object>;
interface CollectionListOptions<F extends FilterAttributes> {
    name: string;
    debug: boolean;
    hasNestedList: boolean;
    readonly rendererOptions: PartialDeep<RendererOptions<F>>;
}
declare class CollectionList<F extends FilterAttributes = {}> {
    static defaultOptions: CollectionListOptions<{}>;
    set debug(val: boolean);
    get debug(): boolean;
    get empty(): boolean;
    container: HTMLElement;
    options: CollectionListOptions<F>;
    renderer: Renderer<F>;
    collectionData: RenderData<F>;
    listElement?: HTMLElement | null;
    emptyState?: HTMLElement | null;
    private items;
    constructor(container: HTMLElement | null, options?: Partial<CollectionListOptions<F>>);
    log(...args: any[]): void;
    warn(...args: any[]): void;
    /** @deprecated Use getter `CollectionList.empty` instead */
    isEmpty(): boolean;
    readData(): void;
    getData(): RenderData<F>;
    getItems(): HTMLElement[];
    /**
     * This method removes every element that was hidden by Webflow's conditional visibility.
     */
    removeInvisibleElements(): void;
    getAttributeData(): any;
}
declare var wfCollections: GlobalWfCollections;
declare var initWfCollections: (collections: Set<string>) => void;
export { CollectionList, initWfCollections, wfCollections };
export type { CollectionListOptions, GlobalCollection, GlobalWfCollections };
