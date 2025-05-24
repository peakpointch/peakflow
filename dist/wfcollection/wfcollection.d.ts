import Renderer, { FilterAttributes, RenderData } from "../renderer";
type GlobalWfCollections = {
    initialized: boolean;
    [key: string]: GlobalCollection | CollectionList | boolean;
};
type GlobalCollection = Array<object>;
declare class CollectionList<F extends FilterAttributes<keyof F & string> = {}> {
    name: string;
    rendererName: string;
    container: HTMLElement;
    renderer: Renderer<F>;
    collectionData: RenderData<F>;
    debug: boolean;
    private listElement;
    private items;
    constructor(container: HTMLElement | null, filterAttributes: F, name?: string, rendererName?: string);
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
export type { GlobalCollection, GlobalWfCollections };
