import { DefaultRegistry, AnyFn } from "./defaults";
import { IANATimeZone } from "../timezones";
export interface PeakflowConfig {
    language?: string;
    timezone?: IANATimeZone;
    debug?: boolean;
}
export declare class Peakflow<R extends Record<string, AnyFn>> {
    private registry;
    private _config;
    constructor(registry: R, config?: PeakflowConfig);
    config(config: Partial<PeakflowConfig>): void;
    getConfig(): PeakflowConfig;
    execute<K extends keyof R>(name: K, ...args: Parameters<R[K]>): ReturnType<R[K]>;
    register<T extends string, F extends AnyFn>(name: T, fn: F): asserts this is Peakflow<R & {
        [K in T]: F;
    }>;
}
export declare const peakflow: Peakflow<DefaultRegistry>;
