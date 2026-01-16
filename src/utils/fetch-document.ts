export async function fetchDocument(path: string): Promise<Document> {
  const securePath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${window.location.protocol}//${window.location.host}/${securePath}`;

  const res = await fetch(url);
  const text = await res.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "text/html");

  return doc;
}

export default fetchDocument;
