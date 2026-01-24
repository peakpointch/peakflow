import type { PartialDeep } from "type-fest";
import Renderer from "../renderer/index.js";
import type { FilterAttributes, RenderData, RendererOptions } from "../renderer/index.js";
import mergeOptions from "../utils/merge-options.js";
import { wf } from "../webflow/webflow.js";
import { exclude } from "../attributeselector/attributeselector.js";

type GlobalWfCollections = {
  initialized: boolean;
  [key: string]: GlobalCollection | CollectionList | boolean; // Enforces array values for all other keys
};

type GlobalCollection = Array<object>;

interface CollectionListOptions<F extends FilterAttributes> {
  name: string;
  debug: boolean;
  hasNestedList: boolean;
  readonly rendererOptions: PartialDeep<RendererOptions<F>>;
}

class CollectionList<F extends FilterAttributes = {}> {
  public static defaultOptions: CollectionListOptions<{}> = {
    name: "",
    debug: false,
    hasNestedList: false,
    rendererOptions: {},
  };

  public get empty(): boolean {
    return !this.listElement && this.container.querySelector(".w-dyn-empty") !== null;
  }

  public container: HTMLElement;
  public options: CollectionListOptions<F>;
  public renderer: Renderer<F>;
  public collectionData: RenderData<F> = [];
  public debug: boolean;
  public listElement?: HTMLElement | null;
  public emptyState?: HTMLElement | null;
  private items: HTMLElement[];

  constructor(container: HTMLElement | null, options?: Partial<CollectionListOptions<F>>) {
    if (!container || !container.classList.contains("w-dyn-list"))
      throw new Error(`Container can't be undefined.`);

    //@ts-expect-error static default options can never match generic instance options
    this.options = mergeOptions(CollectionList.defaultOptions, options);

    this.debug = this.options.debug;
    this.container = container;
    this.listElement = container.querySelector(wf.select.cmsList);
    this.items = Array.from(
      this.listElement?.querySelectorAll(
        this.options.hasNestedList
          ? exclude(wf.select.cmsItem, `${wf.select.cmsList} ${wf.select.cmsList} *`)
          : wf.select.cmsItem,
      ) ?? [],
    );
    this.renderer = new Renderer(container, this.options.rendererOptions);

    if (this.empty) {
      this.warn("Collection is empty.");
      this.emptyState = this.container.querySelector(wf.select.cmsEmpty);
    }
  }

  public log(...args: any[]) {
    if (!this.debug) return;
    console.log(`CollectionList "${this.options.name}":`, ...args);
  }

  public warn(...args: any[]) {
    if (!this.debug) return;
    console.warn(`CollectionList "${this.options.name}":`, ...args);
  }

  /** @deprecated Use getter `CollectionList.empty` instead */
  public isEmpty(): boolean {
    return this.empty;
  }

  public readData(): void {
    if (this.empty) {
      this.collectionData = [];
      return;
    }
    this.collectionData = this.renderer.read(this.listElement);
    this.log("Data:", this.collectionData);
  }

  public getData(): RenderData<F> {
    return this.collectionData;
  }

  public getItems(): HTMLElement[] {
    return this.items;
  }

  /**
   * This method removes every element that was hidden by Webflow's conditional visibility.
   */
  public removeInvisibleElements(): void {
    if (this.empty) return;

    this.listElement
      .querySelectorAll(`.w-condition-invisible:not([data-render-condition="true"])`)
      .forEach((element) => element.remove());
  }

  public getAttributeData(): any {
    let data: any[] = [];

    this.items.forEach((item) => {
      const itemData: Map<string, any> = new Map(Object.entries(item.dataset));
      itemData.forEach((value, key) => {
        if (!key.startsWith("wf")) {
          itemData.delete(key);
        }
      });

      data.push(itemData);
    });

    return data;
  }
}

var wfCollections: GlobalWfCollections = {
  initialized: false,
};

var initWfCollections = (collections: Set<string>): void => {
  if (wfCollections.initialized) return;

  wfCollections.initialized = true;

  collections.forEach((collection) => {
    wfCollections[collection] = [] as GlobalCollection;
  });
};

export { CollectionList, initWfCollections, wfCollections };
export type { CollectionListOptions, GlobalCollection, GlobalWfCollections };
