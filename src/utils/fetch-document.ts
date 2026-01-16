export async function fetchDocument(url: string): Promise<Document> {
  const res = await fetch(url);
  const text = await res.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");

  return doc;
}

export async function fetchOwnDocument(path: string): Promise<Document> {
  const securePath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${window.location.protocol}//${window.location.host}/${securePath}`;

  return await fetchDocument(url);
}
