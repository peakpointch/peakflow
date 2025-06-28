import Renderer, { FilterAttributes, RenderData, RendererOptions } from "../renderer/index.js";
type GlobalWfCollections = {
    initialized: boolean;
    [key: string]: GlobalCollection | CollectionList | boolean;
};
type GlobalCollection = Array<object>;
interface CollectionListOptions<F extends FilterAttributes> {
    name: string;
    readonly rendererOptions: Partial<RendererOptions<F>>;
}
declare class CollectionList<F extends FilterAttributes = {}> {
    options: CollectionListOptions<F>;
    container: HTMLElement;
    renderer: Renderer<F>;
    collectionData: RenderData<F>;
    debug: boolean;
    private listElement;
    private items;
    constructor(container: HTMLElement | null, options?: CollectionListOptions<F>);
    log(...args: any[]): void;
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
