import type {
  CodeIslandLoader,
  CodeIslandProps,
  HTMLCodeIslandElement,
  WebflowCodeComponentsManifest,
} from "./code-component-types.js";

export function isCodeIslandUnparsed(element: Node): element is HTMLElement {
  return element.nodeName === "CODE-ISLAND";
}

export function isCodeIsland<T extends CodeIslandProps = {}>(
  element: Node,
): element is HTMLCodeIslandElement<T> {
  return (
    isCodeIslandUnparsed(element) &&
    (element as any).renderer &&
    typeof (element as any).renderer === "object"
  );
}

export async function getCodeIslandManifest(
  island: HTMLCodeIslandElement,
): Promise<WebflowCodeComponentsManifest> {
  const loader = JSON.parse(island.dataset.loader || "{}") as CodeIslandLoader;
  const url = loader?.val?.clientModuleUrl;

  if (!url)
    throw new Error(
      `Cannot get manifest because Webflow made a breaking change to code components.`,
    );

  const res = await fetch(url);
  const json = (await res.json()) as WebflowCodeComponentsManifest;

  return json;
}

export function awaitCodeIslandUpgrade(
  el: HTMLCodeIslandElement,
  timeout: number = 3000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const interval = 20;
    let elapsed = 0;

    const check = () => {
      if (el.renderer) {
        resolve();
      } else {
        elapsed += interval;
        if (elapsed >= timeout) {
          reject(new Error("CodeIsland did not upgrade in time"));
        } else {
          setTimeout(check, interval);
        }
      }
    };

    check();
  });
}

export async function initCodeIsland(island: HTMLElement): Promise<HTMLCodeIslandElement> {
  // Prevent re-initialization
  if (isCodeIsland(island)) return island;

  if (!isCodeIslandUnparsed(island)) {
    throw new TypeError(`Parameter island has to be of type HTMLCodeIslandElement.`);
  }

  await awaitCodeIslandUpgrade(island as HTMLCodeIslandElement);

  if (!isCodeIsland(island)) {
    throw new Error(`Something went wrong initializing the new code-island.`);
  }

  const newRootElement = document.createElement("div");
  newRootElement.setAttribute("data-root", "true");
  newRootElement.style.display = "contents";

  island.shadowRoot.appendChild(newRootElement);
  island.rootElement = newRootElement;

  let newInternalRoot = island.renderer.mount(newRootElement);
  island.root = newInternalRoot;

  return island;
}

export async function codeIslandRefresh(
  island: Element,
  newIsland: Element,
): Promise<HTMLCodeIslandElement> {
  if (!isCodeIsland(island) || !isCodeIslandUnparsed(newIsland)) {
    throw new TypeError(
      `Parameters island and newIsland have to be of type HTMLCodeIslandElement.`,
    );
  }

  const { version } = await getCodeIslandManifest(island);
  if (version !== 2) {
    throw new Error(
      `Cannot update code component. Webflow has made a breaking change to code components.`,
    );
  }

  island.replaceWith(newIsland);

  await initCodeIsland(newIsland);

  if (!isCodeIsland(newIsland))
    throw new Error(`Something went wrong initializing the new code-island.`);

  newIsland.render(newIsland.props);

  return newIsland;
}
