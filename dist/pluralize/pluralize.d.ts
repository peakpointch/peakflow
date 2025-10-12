export interface Pluralized {
    sg: string;
    pl: string;
}
export declare function pluralize(text: Pluralized, count: number): string;
