import type { ValueOf } from "type-fest";
import type { StringTypeMap } from "../typeutils";
export interface ParsedDataset {
    [key: string]: string | boolean | number;
}
export interface DatasetAttribute<T extends string = string> {
    name: T;
    type: keyof StringTypeMap;
    default?: ValueOf<StringTypeMap>;
}
export declare function parseDataset<T extends ParsedDataset>(container: HTMLElement, attributes: DatasetAttribute[], prefix?: string): T;
