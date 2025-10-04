import type { FieldGroup } from "../fieldgroup";
export interface SerializedItem {
}
export type ItemConstructor<T extends FormArrayItem> = new (...args: any[]) => T;
export declare abstract class FormArrayItem {
    key: string;
    draft: boolean;
    linkedFields?: Map<string, {
        group: string;
        fields: string[];
    }>;
    personalData: FieldGroup;
    constructor(key?: string);
    /** Return a display name, e.g., "Full Name" */
    abstract getFullName(): string;
    /** Validate all required fields; return true if valid */
    abstract validate(): boolean;
    abstract serialize(): any;
    static deserialize(data: any): FormArrayItem;
    /** Compare two items, returns true if equal */
    static areEqual(a: FormArrayItem, b: FormArrayItem): boolean;
    /** Optional: update linked fields */
    linkFields(id: string, group: string, fields: string | string[]): void;
}
