export function logInstance(instance) {
    return instance ? `"${instance}"` : "";
}
export function logPrefix(name, instance) {
    const instanceStr = logInstance(instance);
    return `${name} ${instanceStr}: `;
}
export function asPrefix(str, suffix = "") {
    return str ? `${str}${suffix}` : "";
}
export function asSuffix(str, prefix = "") {
    return str ? `${prefix}${str}` : "";
}
