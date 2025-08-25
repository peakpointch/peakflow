import { defaultRegistry, DefaultRegistry, AnyFn } from "./defaults";
import { IANATimeZone } from "../timezones";

export interface PeakflowConfig {
  language?: string;
  timezone?: IANATimeZone;
  debug?: boolean;
}

export class Peakflow<R extends Record<string, AnyFn>> {
  private registry: R;
  private _config: PeakflowConfig;

  constructor(registry: R, config: PeakflowConfig = {}) {
    this.registry = registry;
    this._config = config;
  }

  config(config: Partial<PeakflowConfig>) {
    this._config = { ...this._config, ...config };
  }

  getConfig(): PeakflowConfig {
    return this._config;
  }

  execute<K extends keyof R>(
    name: K,
    ...args: Parameters<R[K]>
  ): ReturnType<R[K]> {
    return this.registry[name](...args);
  }

  register<T extends string, F extends AnyFn>(
    name: T,
    fn: F,
  ): asserts this is Peakflow<R & { [K in T]: F }> {
    (this.registry as any)[name] = fn;
    return this as any;
  }
}

export const peakflow: Peakflow<DefaultRegistry> = new Peakflow(
  defaultRegistry,
  {
    language: "de",
    timezone: "Europe/Zurich",
    debug: false,
  },
);
