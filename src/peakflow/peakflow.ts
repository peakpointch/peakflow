import { defaultRegistry } from "./defaults";
import type { AnyFn, DefaultRegistry, Registry } from "./defaults";
import type { IANATimeZone } from "../timezones";
import type { PeakflowShared } from "../../types/peakflow.d.ts";

export interface PeakflowConfig {
  language?: string;
  timezone?: IANATimeZone;
  debug?: boolean;
}

export class Peakflow<R extends Registry> {
  private static instance: Peakflow<Registry>;
  private registry: R;
  private _config: PeakflowConfig;

  public readonly shared: PeakflowShared;

  private constructor(registry: R, config: PeakflowConfig = {}) {
    this.registry = registry;
    this._config = config;
  }

  public static init<R extends Registry>(registry: R, config: PeakflowConfig = {}): Peakflow<R> {
    if (Peakflow.instance) {
      console.warn(`Peakflow is already initialized. Ignoring new config.`);
      return Peakflow.instance as Peakflow<R>;
    }
    Peakflow.instance = new Peakflow(registry, config);
    return Peakflow.instance as Peakflow<R>;
  }

  public static getInstance<R extends Registry>(): Peakflow<R> {
    if (!Peakflow.instance) {
      throw new Error(`Peakflow must be initialized with .init(registry, config) before use.`);
    }
    return Peakflow.instance as Peakflow<R>;
  }

  config(config: Partial<PeakflowConfig>) {
    this._config = { ...this._config, ...config };
  }

  getConfig(): PeakflowConfig {
    return this._config;
  }

  share(key: string, val: any): void {
    this.shared[key] = val;
    window.peakflow.shared = this.shared;
  }

  unshare(key: string): void {
    delete this.shared[key];
    window.peakflow.shared = this.shared;
  }

  execute<K extends keyof R>(...name: K[]): void {
    name.forEach((fn) => {
      this.registry[fn]();
    });
  }

  register<T extends string, F extends AnyFn>(
    name: T,
    fn: F,
  ): asserts this is Peakflow<R & { [K in T]: F }> {
    (this.registry as any)[name] = fn;
    return this as any;
  }
}

export const peakflow: Peakflow<DefaultRegistry> = Peakflow.init(defaultRegistry, {
  language: "de",
  timezone: "Europe/Zurich",
  debug: false,
});
