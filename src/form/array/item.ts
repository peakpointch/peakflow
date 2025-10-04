import type { FieldGroup } from "../fieldgroup";

export interface SerializedItem {}

export type ItemConstructor<T extends FormArrayItem> = new (...args: any[]) => T;

export abstract class FormArrayItem {
  public key: string;
  public draft: boolean = false;
  public linkedFields?: Map<string, { group: string; fields: string[] }> = new Map();

  public personalData: FieldGroup;

  constructor(key?: string) {
    this.key = key ?? crypto.randomUUID(); // generate unique key
  }

  /** Return a display name, e.g., "Full Name" */
  abstract getFullName(): string;

  /** Validate all required fields; return true if valid */
  abstract validate(): boolean;

  abstract serialize(): any;

  static deserialize(data: any): FormArrayItem {
    if (data || !data)
      throw new Error(
        `You are trying to use an abstract class. Please write your own implementation of this class.`,
      );
    return data as FormArrayItem;
  }

  /** Compare two items, returns true if equal */
  static areEqual(a: FormArrayItem, b: FormArrayItem): boolean {
    // Must be implemented by subclass
    return JSON.stringify(a) === JSON.stringify(b);
  }

  /** Optional: update linked fields */
  linkFields(id: string, group: string, fields: string | string[]) {
    if (!id)
      throw new Error(
        `ResidentProspect "${this.getFullName()}": The group id "${id}" for linking fields is not valid.`,
      );

    let inputIds = fields;
    if (typeof inputIds === "string") {
      inputIds = inputIds?.split(",").map((id) => id.trim());
    }

    if (inputIds.length === 0 || inputIds.some((id) => id === "")) {
      throw new Error(
        `Please specify the ids of the fields you want to link. Ensure no ids are an empty string.`,
      );
    }

    this.linkedFields.set(id, { group, fields: inputIds });
  }
}
