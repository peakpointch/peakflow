import type { FieldGroup } from "../fieldgroup.js";
export interface SerializedItem {
    [x: string]: string | number | any;
}
export type ItemConstructor<T extends FormArrayItem> = {
    new (...args: any[]): T;
    deserialize(data: any): T;
    areEqual(a: T, b: T): boolean;
};
export declare abstract class FormArrayItem {
    key: string;
    draft: boolean;
    linkedFields?: Map<string, {
        group: string;
        fields: string[];
    }>;
    personalData: FieldGroup;
    constructor(key?: string);
    /**
     * @returns a display name
     */
    abstract getFullName(): string;
    /**
     * Validate all required fields
     * @returns true if valid
     */
    abstract validate(): boolean;
    abstract serialize(): any;
    static deserialize(data: any): FormArrayItem;
    /**
     * Compare two items
     * @returns true if items contain equal values
     */
    static areEqual(a: FormArrayItem, b: FormArrayItem): boolean;
    /** Optional: update linked fields */
    linkFields(id: string, group: string, fields: string | string[]): void;
}
