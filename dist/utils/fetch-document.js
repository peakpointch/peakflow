export async function fetchDocument(url, init) {
    const res = await fetch(url, init);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    return doc;
}
export async function fetchOwnDocument(path, init) {
    const securePath = path.startsWith("/") ? path.slice(1) : path;
    const url = `${window.location.protocol}//${window.location.host}/${securePath}`;
    return await fetchDocument(url, init);
}
