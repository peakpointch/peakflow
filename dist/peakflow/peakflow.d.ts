import type { AnyFn, DefaultRegistry, Registry } from "./defaults";
import type { IANATimeZone } from "../timezones";
export interface PeakflowConfig {
    language?: string;
    timezone?: IANATimeZone;
    debug?: boolean;
}
export declare class Peakflow<R extends Registry> {
    private static instance;
    private registry;
    private _config;
    private constructor();
    static init<R extends Registry>(registry: R, config?: PeakflowConfig): Peakflow<R>;
    static getInstance<R extends Registry>(): Peakflow<R>;
    config(config: Partial<PeakflowConfig>): void;
    getConfig(): PeakflowConfig;
    execute<K extends keyof R>(...name: K[]): void;
    register<T extends string, F extends AnyFn>(name: T, fn: F): asserts this is Peakflow<R & {
        [K in T]: F;
    }>;
}
export declare const peakflow: Peakflow<DefaultRegistry>;
