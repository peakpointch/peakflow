import { defaultRegistry } from "./defaults";
export class Peakflow {
    constructor(registry, config = {}) {
        this.registry = registry;
        this._config = config;
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
export const peakflow = new Peakflow(defaultRegistry, {
    language: "de",
    timezone: "Europe/Zurich",
    debug: false,
});
