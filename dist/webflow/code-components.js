export function isCodeIslandUnparsed(element) {
    return element.nodeName === "CODE-ISLAND";
}
export function isCodeIsland(element) {
    return (isCodeIslandUnparsed(element) &&
        element.renderer &&
        typeof element.renderer === "object");
}
export async function getCodeIslandManifest(island) {
    const loader = JSON.parse(island.dataset.loader || "{}");
    const url = loader?.val?.clientModuleUrl;
    if (!url)
        throw new Error(`Cannot get manifest because Webflow made a breaking change to code components.`);
    const res = await fetch(url);
    const json = (await res.json());
    return json;
}
export function awaitCodeIslandUpgrade(el, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const interval = 20;
        let elapsed = 0;
        const check = () => {
            if (el.renderer) {
                resolve();
            }
            else {
                elapsed += interval;
                if (elapsed >= timeout) {
                    reject(new Error("CodeIsland did not upgrade in time"));
                }
                else {
                    setTimeout(check, interval);
                }
            }
        };
        check();
    });
}
export async function initCodeIsland(island) {
    // Prevent re-initialization
    if (isCodeIsland(island))
        return island;
    if (!isCodeIslandUnparsed(island)) {
        throw new TypeError(`Parameter island has to be of type HTMLCodeIslandElement.`);
    }
    await awaitCodeIslandUpgrade(island);
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
    const dataset = island.parseDataset();
    island.props = dataset.props;
    island.slots = dataset.slots;
    island.webflowContext = dataset.webflowContext;
    return island;
}
export async function codeIslandRefresh(island, newIsland) {
    if (!isCodeIsland(island) || !isCodeIslandUnparsed(newIsland)) {
        throw new TypeError(`Parameters island and newIsland have to be of type HTMLCodeIslandElement.`);
    }
    const { version } = await getCodeIslandManifest(island);
    if (version !== 2) {
        throw new Error(`Cannot update code component. Webflow has made a breaking change to code components.`);
    }
    island.replaceWith(newIsland);
    await initCodeIsland(newIsland);
    if (!isCodeIsland(newIsland))
        throw new Error(`Something went wrong initializing the new code-island.`);
    newIsland.render(newIsland.props);
    return newIsland;
}
