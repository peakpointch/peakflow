export interface Pluralized {
  singular: string;
  plural: string;
}

export function pluralize(text: Pluralized, count: number): string {
  if (count === 1) {
    return text.singular;
  } else {
    return text.plural;
  }
}
