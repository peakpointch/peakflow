// =============================
// ====== Implementations ======
// =============================
export class Dataset {
    // ============================
    // ====== Initialization ======
    // ============================
    constructor(attributes) {
        this.attr = Attr.define(attributes);
        this.definition = attributes;
    }
    static define(attributes) {
        const definition = Object.entries(attributes).reduce((acc, [key, val]) => {
            acc[key] = {
                accessor: key,
                ...Dataset.defineAttribute(val),
            };
            return acc;
        }, {});
        return new Dataset(definition);
    }
    static defineAttribute(attr) {
        let result;
        if (typeof attr === "string") {
            result = {
                name: attr,
                type: Dataset.String(attr).type,
            };
        }
        else {
            result = {
                name: attr.name,
                type: attr.type || Dataset.String(attr.name).type,
                default: attr.default,
            };
        }
        return result;
    }
    // ===========================
    // ====== Parsing Logic ======
    // ===========================
    static parse(element, attributes) {
        const attrArray = Object.entries(attributes);
        return attrArray.reduce((acc, [key, attr]) => {
            return {
                ...acc,
                [key]: attr.type(element.getAttribute(attr.name), attr) ?? attr.default,
            };
        }, {});
    }
    parse(element) {
        return Dataset.parse(element, this.definition);
    }
    static getAttribute(element, attr) {
        const def = this.defineAttribute(attr);
        return def.type(element.getAttribute(def.name), def) ?? def.default;
    }
    // =============================
    // ====== Attribute Types ======
    // =============================
    static String(name, defaultValue) {
        return {
            name,
            default: defaultValue,
            type: (val, attr) => (val ?? attr.default ?? ""),
        };
    }
    static Boolean(name, defaultValue) {
        return {
            name,
            default: defaultValue,
            type: (val, attr) => {
                if (val === null)
                    return attr.default;
                if (val !== "true" && val !== "false") {
                    throw new Error(`Attribute "${attr.name}" is not boolean`);
                }
                return val === "true";
            },
        };
    }
    static Number(name, defaultValue) {
        return {
            name,
            default: defaultValue,
            type: (val, attr) => {
                const n = parseFloat(val);
                return !isNaN(n) ? n : attr.default;
            },
        };
    }
    static NumberOrAuto(name, defaultValue) {
        return {
            name,
            default: defaultValue,
            type: (val, attr) => {
                const n = parseFloat(val);
                return val === "auto" ? "auto" : !isNaN(n) ? n : attr.default;
            },
        };
    }
}
export class Attr {
    static define(attributes) {
        const attr = Object.entries(attributes).reduce((acc, [key, attr]) => {
            return {
                ...acc,
                [key]: typeof attr === "string" ? attr : attr.name,
            };
        }, {});
        return attr;
    }
}
