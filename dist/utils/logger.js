export function logInstance(instance) {
    return instance ? `"${instance}"` : "";
}
export function logPrefix(name, instance) {
    const instanceStr = logInstance(instance);
    return `${name} ${instanceStr}: `;
}
