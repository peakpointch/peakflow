interface VimeConfig {
    container: HTMLElement;
    customPoster: boolean;
}
export declare const vimeDefault: VimeConfig;
export declare function loadVimeAssets(): Promise<void>;
export declare function initVimePlayer(config?: Partial<VimeConfig>): Promise<void>;
export {};
