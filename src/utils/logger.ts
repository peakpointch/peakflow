export function logInstance(instance?: string): string {
  return instance ? `"${instance}"` : "";
}

export function logPrefix(name: string, instance?: string): string {
  const instanceStr = logInstance(instance);
  return `${name} ${instanceStr}: `;
}

export function asPrefix(str: string | null | undefined, suffix: string = ""): string {
  return str ? `${str}${suffix}` : "";
}

export function asSuffix(str: string | null | undefined, prefix: string = ""): string {
  return str ? `${prefix}${str}` : "";
}
