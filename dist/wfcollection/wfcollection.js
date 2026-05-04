import Renderer from "../renderer/index.js";
import mergeOptions from "../utils/merge-options.js";
import { wf } from "../webflow/webflow.js";
import { exclude } from "../selector/selector.js";
class CollectionList {
    set debug(val) {
        this.options.debug = val;
    }
    get debug() {
        return this.options.debug;
    }
    get empty() {
        return !this.listElement && this.container.querySelector(".w-dyn-empty") !== null;
    }
    constructor(container, options) {
        this.collectionData = [];
        if (!container || !container.classList.contains("w-dyn-list"))
            throw new Error(`Container can't be undefined.`);
        //@ts-expect-error static default options can never match generic instance options
        this.options = mergeOptions(CollectionList.defaultOptions, options);
        this.debug = this.options.debug;
        this.container = container;
        this.listElement = container.querySelector(wf.select.cmsList);
        this.items = Array.from(this.listElement?.querySelectorAll(this.options.hasNestedList
            ? exclude(wf.select.cmsItem, `${wf.select.cmsList} ${wf.select.cmsList} *`)
            : wf.select.cmsItem) ?? []);
        this.renderer = new Renderer(container, this.options.rendererOptions);
        if (this.empty) {
            this.warn("Collection is empty.");
            this.emptyState = this.container.querySelector(wf.select.cmsEmpty);
        }
    }
    log(...args) {
        if (!this.debug)
            return;
        console.log(`CollectionList "${this.options.name}":`, ...args);
    }
    warn(...args) {
        if (!this.debug)
            return;
        console.warn(`CollectionList "${this.options.name}":`, ...args);
    }
    /** @deprecated Use getter `CollectionList.empty` instead */
    isEmpty() {
        console.warn(`WfCollection.isEmpty() has been deprecated and will be removed in the next major version. Use WfCollection.empty instead.`);
        return this.empty;
    }
    readData() {
        if (this.empty) {
            this.collectionData = [];
            return;
        }
        this.collectionData = this.renderer.read(this.listElement);
        this.log("Data:", this.collectionData);
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
        if (this.empty)
            return;
        this.listElement
            .querySelectorAll(`.w-condition-invisible:not([data-render-condition="true"])`)
            .forEach((element) => element.remove());
    }
    /** @deprecated Use Renderer class instead. */
    getAttributeData() {
        console.warn(`WfCollection.getAttributeData() has been deprecated and will be removed in the next major version. Use Renderer class instead.`);
        let data = [];
        this.items.forEach((item) => {
            const itemData = new Map(Object.entries(item.dataset));
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
CollectionList.defaultOptions = {
    name: "",
    debug: false,
    hasNestedList: false,
    rendererOptions: {},
};
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
