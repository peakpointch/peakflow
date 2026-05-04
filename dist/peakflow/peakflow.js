import { defaultRegistry } from "./defaults";
export class Peakflow {
    constructor(registry, config = {}) {
        this.registry = registry;
        this._config = config;
    }
    static init(registry, config = {}) {
        if (Peakflow.instance) {
            console.warn(`Peakflow is already initialized. Ignoring new config.`);
            return Peakflow.instance;
        }
        Peakflow.instance = new Peakflow(registry, config);
        return Peakflow.instance;
    }
    static getInstance() {
        if (!Peakflow.instance) {
            throw new Error(`Peakflow must be initialized with .init(registry, config) before use.`);
        }
        return Peakflow.instance;
    }
    config(config) {
        this._config = { ...this._config, ...config };
    }
    getConfig() {
        return this._config;
    }
    execute(...name) {
        name.forEach((fn) => {
            this.registry[fn]();
        });
    }
    register(name, fn) {
        this.registry[name] = fn;
        return this;
    }
}
export const peakflow = Peakflow.init(defaultRegistry, {
    language: "de",
    timezone: "Europe/Zurich",
    debug: false,
});
