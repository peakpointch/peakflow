export interface Pluralized {
    singular: string;
    plural: string;
}
export declare function pluralize(text: Pluralized, count: number): string;
