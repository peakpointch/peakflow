export function logInstance(instance?: string): string {
  return instance ? `"${instance}"` : "";
}

export function logPrefix(name: string, instance?: string): string {
  const instanceStr = logInstance(instance);
  return `${name} ${instanceStr}: `;
}
