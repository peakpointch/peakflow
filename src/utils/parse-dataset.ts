import type { ValueOf } from "type-fest";
import type { StringTypeMap } from "../typeutils";
import { toCamelCase } from "../utils";

export interface ParsedDataset {
  [key: string]: string | boolean | number;
}

export interface DatasetAttribute<T extends string = string> {
  name: T;
  type: keyof StringTypeMap;
  default?: ValueOf<StringTypeMap>;
}

function getKeyFromAttributeName(name: string, prefix: string = ""): string {
  if (name.startsWith(`data-${prefix}`)) {
    return toCamelCase(name.replace(`data-${prefix}`, ""));
  } else if (name.startsWith("data-")) {
    return toCamelCase(name.replace("data-", ""));
  } else {
    return toCamelCase(name);
  }
}

export function parseDataset<T extends ParsedDataset>(
  container: HTMLElement,
  attributes: DatasetAttribute[],
  prefix?: string,
): T {
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
        } else {
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

  return dataset as T;
}
