export class FormArrayItem {
    constructor(key) {
        this.draft = false;
        this.linkedFields = new Map();
        this.key = this.key ?? key ?? crypto.randomUUID(); // generate unique key
    }
    static deserialize(data) {
        if (data || !data)
            throw new Error(`You are trying to use an abstract class. Please write your own implementation of this class.`);
        return data;
    }
    /**
     * Compare two items
     * @returns true if items contain equal values
     */
    static areEqual(a, b) {
        // Must be implemented by subclass
        return JSON.stringify(a) === JSON.stringify(b);
    }
    /** Optional: update linked fields */
    linkFields(id, group, fields) {
        if (!id)
            throw new Error(`ResidentProspect "${this.getFullName()}": The group id "${id}" for linking fields is not valid.`);
        let inputIds = fields;
        if (typeof inputIds === "string") {
            inputIds = inputIds?.split(",").map((id) => id.trim());
        }
        if (inputIds.length === 0 || inputIds.some((id) => id === "")) {
            throw new Error(`Please specify the ids of the fields you want to link. Ensure no ids are an empty string.`);
        }
        this.linkedFields.set(id, { group, fields: inputIds });
    }
}
