import Renderer from "../renderer/index.js";
class CollectionList {
    constructor(container, options = { name: '', rendererOptions: {} }) {
        this.options = options;
        this.collectionData = [];
        this.debug = false;
        if (!container || !container.classList.contains('w-dyn-list'))
            throw new Error(`Container can't be undefined.`);
        this.container = container;
        this.listElement = container.querySelector('.w-dyn-items');
        this.items = Array.from(this.listElement?.querySelectorAll('.w-dyn-item:not(.w-dyn-list .w-dyn-list *)') ?? []);
        this.renderer = new Renderer(container, this.options.rendererOptions);
    }
    log(...args) {
        if (!this.debug)
            return;
        console.log(`"${this.options.name}" CollectionList:`, ...args);
    }
    isEmpty() {
        const isEmpty = !this.listElement && this.container.querySelector('.w-dyn-empty') !== null;
        if (isEmpty) {
            console.warn(`Collection "${this.options.name}" is empty.`);
        }
        return isEmpty;
    }
    readData() {
        if (this.isEmpty()) {
            this.collectionData = [];
            return;
        }
        this.collectionData = this.renderer.read(this.listElement);
        this.log('Data:', this.collectionData);
    }
    getData() {
        return this.collectionData;
    }
    getItems() {
        return this.items;
    }
    /**
     * This method removes every element that was hidden by Webflow's conditional visibility.
     */
    removeInvisibleElements() {
        if (this.isEmpty())
            return;
        this.listElement.querySelectorAll(`.w-condition-invisible:not([data-render-condition="true"])`)
            .forEach(element => element.remove());
    }
    getAttributeData() {
        let data = [];
        this.items.forEach(item => {
            const itemData = new Map(Object.entries(item.dataset));
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
var wfCollections = {
    initialized: false,
};
var initWfCollections = (collections) => {
    if (wfCollections.initialized)
        return;
    wfCollections.initialized = true;
    collections.forEach((collection) => {
        wfCollections[collection] = [];
    });
};
export { CollectionList, initWfCollections, wfCollections };
