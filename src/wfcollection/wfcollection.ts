import type { PartialDeep } from "type-fest";
import Renderer from "../renderer/index.js";
import type { FilterAttributes, RenderData, RendererOptions } from "../renderer/index.js";
import mergeOptions from "../utils/merge-options.js";
import { wf } from "../webflow/webflow.js";
import { exclude } from "../selector/selector.js";

type GlobalWfCollections = {
  initialized: boolean;
  [key: string]: GlobalWfCollection | WfCollection | boolean; // Enforces array values for all other keys
};

type GlobalWfCollection = Array<object>;

interface WfCollectionOptions<F extends FilterAttributes> {
  name: string;
  debug: boolean;
  hasNestedList: boolean;
  readonly rendererOptions: PartialDeep<RendererOptions<F>>;
}

class WfCollection<F extends FilterAttributes = {}> {
  public static defaultOptions: WfCollectionOptions<{}> = {
    name: "",
    debug: false,
    hasNestedList: false,
    rendererOptions: {},
  };

  public set debug(val: boolean) {
    this.options.debug = val;
  }

  public get debug(): boolean {
    return this.options.debug;
  }

  public get empty(): boolean {
    return !this.listElement && this.container.querySelector(".w-dyn-empty") !== null;
  }

  public container: HTMLElement;
  public options: WfCollectionOptions<F>;
  public renderer: Renderer<F>;
  public collectionData: RenderData<F> = [];
  public listElement?: HTMLElement | null;
  public emptyState?: HTMLElement | null;
  private items: HTMLElement[];

  constructor(container: HTMLElement | null, options?: Partial<WfCollectionOptions<F>>) {
    if (!container || !container.classList.contains("w-dyn-list"))
      throw new Error(`Container can't be undefined.`);

    //@ts-expect-error static default options can never match generic instance options
    this.options = mergeOptions(WfCollection.defaultOptions, options);

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
    console.log(`WfCollection "${this.options.name}":`, ...args);
  }

  public warn(...args: any[]) {
    if (!this.debug) return;
    console.warn(`WfCollection "${this.options.name}":`, ...args);
  }

  /** @deprecated Use getter `WfCollection.empty` instead */
  public isEmpty(): boolean {
    console.warn(
      `WfCollection.isEmpty() has been deprecated and will be removed in the next major version. Use WfCollection.empty instead.`,
    );
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

  /** @deprecated Use Renderer class instead. */
  public getAttributeData(): any {
    console.warn(
      `WfCollection.getAttributeData() has been deprecated and will be removed in the next major version. Use Renderer class instead.`,
    );
    let data: any[] = [];

    this.items.forEach((item) => {
      const itemData: Map<string, any> = new Map(Object.entries(item.dataset));
      itemData.forEach((_, key) => {
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
    wfCollections[collection] = [] as GlobalWfCollection;
  });
};

export { WfCollection, initWfCollections, wfCollections };
export type { WfCollectionOptions, GlobalWfCollection, GlobalWfCollections };
