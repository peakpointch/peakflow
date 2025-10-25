import { toCamelCase } from "../utils";
function getKeyFromAttributeName(name, prefix = "") {
    if (name.startsWith(`data-${prefix}`)) {
        return toCamelCase(name.replace(`data-${prefix}`, ""));
    }
    else if (name.startsWith("data-")) {
        return toCamelCase(name.replace("data-", ""));
    }
    else {
        return toCamelCase(name);
    }
}
export function parseDataset(container, attributes, prefix) {
    const dataset = {};
    attributes.forEach((attribute) => {
        const key = getKeyFromAttributeName(attribute.name, prefix);
        const value = container.getAttribute(attribute.name);
        switch (attribute.type) {
            case "string":
                dataset[key] = value || attribute.default || "";
                break;
            case "boolean":
                if (value !== "false" && value !== "true" && attribute.default === undefined) {
                    throw new Error(`Attribute "${attribute.name}" is not a boolean.`);
                }
                dataset[key] = JSON.parse(value || attribute.default?.toString() || "{}") ?? undefined;
                break;
            case "number":
                const float = parseFloat(value || attribute.default?.toString() || "");
                if (isNaN(float)) {
                    console.warn("TypeError: Failed to parse attribute value as float.");
                    dataset[key] = undefined;
                }
                else {
                    dataset[key] = float;
                }
                break;
            case "numberOrAuto":
                dataset[key] = value === "auto" ? "auto" : parseFloat(value || "") || "auto";
                break;
            default:
                dataset[key] = value || attribute.default || "";
                break;
        }
    });
    return dataset;
}
