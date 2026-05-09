import type { PartialDeep } from "type-fest";
import Renderer from "../renderer/index.js";
import type { FilterAttributes, RenderData, RendererOptions } from "../renderer/index.js";
type GlobalWfCollections = {
    initialized: boolean;
    [key: string]: GlobalWfCollection | WfCollection | boolean;
};
type GlobalWfCollection = Array<object>;
interface WfCollectionOptions<F extends FilterAttributes> {
    name: string;
    debug: boolean;
    hasNestedList: boolean;
    readonly rendererOptions: PartialDeep<RendererOptions<F>>;
}
declare class WfCollection<F extends FilterAttributes = {}> {
    static defaultOptions: WfCollectionOptions<{}>;
    set debug(val: boolean);
    get debug(): boolean;
    get empty(): boolean;
    container: HTMLElement;
    options: WfCollectionOptions<F>;
    renderer: Renderer<F>;
    collectionData: RenderData<F>;
    listElement?: HTMLElement | null;
    emptyState?: HTMLElement | null;
    private items;
    constructor(container: HTMLElement | null, options?: Partial<WfCollectionOptions<F>>);
    log(...args: any[]): void;
    warn(...args: any[]): void;
    /** @deprecated Use getter `WfCollection.empty` instead */
    isEmpty(): boolean;
    readData(): void;
    getData(): RenderData<F>;
    getItems(): HTMLElement[];
    /**
     * This method removes every element that was hidden by Webflow's conditional visibility.
     */
    removeInvisibleElements(): void;
    /** @deprecated Use Renderer class instead. */
    getAttributeData(): any;
}
declare var wfCollections: GlobalWfCollections;
declare var initWfCollections: (collections: Set<string>) => void;
export { WfCollection, initWfCollections, wfCollections };
export type { WfCollectionOptions, GlobalWfCollection, GlobalWfCollections };
