import Renderer, { RenderData } from "@library/renderer";

type GlobalWfCollections = {
  initialized: boolean;
  [key: string]: GlobalCollection | CollectionList | boolean;  // Enforces array values for all other keys
};

type GlobalCollection = Array<object>;

class CollectionList {
  public container: HTMLElement;
  public renderer: Renderer;
  public collectionData: RenderData = [];
  public debug: boolean = false;
  private listElement: HTMLElement;
  private items: HTMLElement[];

  constructor(container: HTMLElement | null, public name: string = '', public rendererName: string = 'wf') {
    if (!container || !container.classList.contains('w-dyn-list')) throw new Error(`Container can't be undefined.`);

    this.container = container;
    this.listElement = container.querySelector('.w-dyn-items');
    this.items = Array.from(this.listElement?.querySelectorAll('.w-dyn-item:not(.w-dyn-list .w-dyn-list *)') ?? []);
    this.renderer = new Renderer(container, this.rendererName);
  }

  public log(...args: any[]) {
    if (!this.debug) return;
    console.log(`"${this.name}" CollectionList:`, ...args);
  }

  public isEmpty(): boolean {
    const isEmpty = !this.listElement && this.container.querySelector('.w-dyn-empty') !== null;

    if (isEmpty) {
      console.warn(`Collection "${this.name}" is empty.`);
    }

    return isEmpty;
  }

  public readData(): void {
    if (this.isEmpty()) {
      this.collectionData = [];
      return;
    }
    this.collectionData = this.renderer.read(this.listElement);
    this.log('Data:', this.collectionData);
  }

  public getData(): RenderData {
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

    this.listElement.querySelectorAll(".w-condition-invisible")
      .forEach(element => element.remove());
  }

  public getAttributeData(): any {
    let data: any[] = [];

    this.items.forEach(item => {
      const itemData: Map<string, any> = new Map(Object.entries(item.dataset));
      itemData.forEach((value, key) => {
        if (!key.startsWith('wf')) {
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
export type { GlobalCollection, GlobalWfCollections };
