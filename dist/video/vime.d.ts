interface VimeConfig {
    customPoster: boolean;
}
export declare const defaultConfig: VimeConfig;
export declare function loadVimeAssets(): Promise<void>;
export declare function initVimePlayer(config?: VimeConfig): Promise<void>;
export {};
