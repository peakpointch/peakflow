type AttributeMatchType =
  | 'startsWith'    // ^=
  | 'endsWith'      // $=
  | 'includes'      // *=
  | 'whitespace'    // ~=
  | 'hyphen'        // |=
  | 'exact';        // =
type AttributeMatchOperator = '^' | '$' | '*' | '~' | '|' | '';
type AttributeMatchTypeMap = {
  [key in AttributeMatchType]: AttributeMatchOperator;
};
type AttributeSelector<T = string> = (name?: T, type?: AttributeMatchType) => string;

interface AttributeOptions<T extends string> {
  defaultType: AttributeMatchType;
  defaultValue: T | undefined;
  exclusions: string[];
}

const attrMatchTypes: AttributeMatchTypeMap = {
  startsWith: '^',
  endsWith: '$',
  includes: '*',
  whitespace: '~',
  hyphen: '|',
  exact: ''
};

/**
 * Converts a human-friendly `AttributeType` to a CSS `AttributeOperator`.
 */
function getOperator(type: AttributeMatchType): AttributeMatchOperator {
  return attrMatchTypes[type] || '';
}

/**
 * Excludes a CSS selector from a CSS selector.
 *
 * @param selector The original selector that should exclude specific elements.
 * @param exclusions The selectors to exclude from the original selector.
 * @returns A CSS selector.
 */
function exclude(selector: string, ...exclusions: string[]): string {
  if (exclusions.length === 0) return selector;

  const result: string[] = [];
  let current = '';
  let depth = 0;
  let i = 0;

  while (i < selector.length) {
    const char = selector[i];

    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
    }

    if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      i++; // skip comma
      while (selector[i] === ' ') i++; // skip all spaces after comma
      continue;
    }

    current += char;
    i++;
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result.map(sel => `${sel}:not(${exclusions.join(', ')})`).join(', ');
}

/**
 * Creates a selector function based on the provided attribute name.
 * The returned selector function can be used to generate a string selector for the given name.
 * If no name is provided, it will return a selector with just the attribute name.
 * 
 * @template T - The type of the name that will be passed to the generated selector function (e.g., string).
 * @param attrName - The name of the attribute that will be used in the selector.
 * @param options - Options to configure selector generation.
 * @returns A function that generates the selector string based on the provided name and match type.
 */
const createAttribute = <T extends string = string>(
  attrName: string,
  options: AttributeOptions<T> = {
    defaultType: 'exact',
    defaultValue: undefined,
    exclusions: [],
  },
): AttributeSelector<T> => {
  return (name: T | undefined = options.defaultValue, type: AttributeMatchType = options.defaultType): string => {
    if (!name) {
      return exclude(`[${attrName}]`, ...options.exclusions);
    }

    const value = String(name); // Ensure it's a string for selector use
    const selector = `[${attrName}${getOperator(type)}="${value}"]`;

    return exclude(selector, ...(options.exclusions ?? []));
  };
}

export default createAttribute;
export { exclude };
