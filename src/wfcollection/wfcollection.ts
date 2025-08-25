import Renderer from "../renderer/index.js";
import type { FilterAttributes, RenderData, RendererOptions } from "../renderer/index.js";

type GlobalWfCollections = {
  initialized: boolean;
  [key: string]: GlobalCollection | CollectionList | boolean; // Enforces array values for all other keys
};

type GlobalCollection = Array<object>;

interface CollectionListOptions<F extends FilterAttributes> {
  name: string;
  readonly rendererOptions: Partial<RendererOptions<F>>;
}

class CollectionList<F extends FilterAttributes = {}> {
  public container: HTMLElement;
  public renderer: Renderer<F>;
  public collectionData: RenderData<F> = [];
  public debug: boolean = false;
  private listElement: HTMLElement;
  private items: HTMLElement[];

  constructor(
    container: HTMLElement | null,
    public options: CollectionListOptions<F> = {
      name: "",
      rendererOptions: {},
    },
  ) {
    if (!container || !container.classList.contains("w-dyn-list"))
      throw new Error(`Container can't be undefined.`);

    this.container = container;
    this.listElement = container.querySelector(".w-dyn-items");
    this.items = Array.from(
      this.listElement?.querySelectorAll(".w-dyn-item:not(.w-dyn-list .w-dyn-list *)") ?? [],
    );
    this.renderer = new Renderer(container, this.options.rendererOptions);
  }

  public log(...args: any[]) {
    if (!this.debug) return;
    console.log(`"${this.options.name}" CollectionList:`, ...args);
  }

  public isEmpty(): boolean {
    const isEmpty = !this.listElement && this.container.querySelector(".w-dyn-empty") !== null;

    if (isEmpty) {
      console.warn(`Collection "${this.options.name}" is empty.`);
    }

    return isEmpty;
  }

  public readData(): void {
    if (this.isEmpty()) {
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
    if (this.isEmpty()) return;

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
