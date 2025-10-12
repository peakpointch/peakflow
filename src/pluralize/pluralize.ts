export interface Pluralized {
  sg: string;
  pl: string;
}

export function pluralize(text: Pluralized, count: number): string {
  if (count === 1) {
    return text.sg;
  } else {
    return text.pl;
  }
}
