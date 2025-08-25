import "@vime/core";

interface VimeConfig {
  customPoster: boolean;
}

export const defaultConfig: VimeConfig = {
  customPoster: false,
};

export async function loadVimeAssets(): Promise<void> {
  const head = document.head;

  const exists = (tag: "link" | "script", url: string) =>
    Array.from(document.querySelectorAll(tag)).some((el) =>
      tag === "link"
        ? (el as HTMLLinkElement).href.includes(url)
        : (el as HTMLScriptElement).src.includes(url),
    );

  const appendLink = (href: string) => {
    if (!exists("link", href)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      head.appendChild(link);
    }
  };

  // Add CSS
  appendLink("https://cdn.jsdelivr.net/npm/@vime/core@^5/themes/default.css");
  appendLink("https://cdn.jsdelivr.net/npm/@vime/core@^5/themes/light.css");

  // Add JS and await it loading
  const vimeScript = "https://cdn.jsdelivr.net/npm/@vime/core@^5/dist/vime/vime.esm.js";
  if (!exists("script", vimeScript)) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = vimeScript;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${vimeScript}`));
      head.appendChild(script);
    });
  }
}

function getCustomPoster(player: HTMLVmPlayerElement): HTMLElement {
  const wrapper = player.parentElement;
  const poster = wrapper?.querySelector<HTMLElement>("[vm-custom-poster]");

  if (!poster) {
    throw new Error(
      `Vime: Custom poster not found. Did you forget the "[vm-custom-poster]" attribute?`,
    );
  }

  return poster;
}

function getPlayerControls(player: HTMLVmPlayerElement): HTMLVmControlsElement {
  const controls = player.querySelector("vm-controls");
  if (!controls) {
    throw new Error(`Vime: "vm-controls" element not found.`);
  }
  return controls;
}

async function setup(player: HTMLVmPlayerElement, config: VimeConfig): Promise<void> {
  const adapter = await player.getAdapter();
  const controls = getPlayerControls(player);
  const poster = config.customPoster ? getCustomPoster(player) : null;

  if (!adapter) {
    throw new Error(`Vime: Failed to get adapter.`);
  }

  poster.addEventListener("click", () => {
    adapter.play();
  });

  controls.style.opacity = "0";

  player.addEventListener("vmPausedChange", () => {
    if (!config.customPoster) return;

    switch (player.paused) {
      case true:
        poster.style.removeProperty("display");
        controls.style.opacity = "0";
        break;

      case false:
        poster.style.display = "none";
        controls.style.opacity = "1";
        break;
    }
  });
}

export async function initVimePlayer(config: VimeConfig = defaultConfig): Promise<void> {
  await loadVimeAssets();
  const allPlayers = document.querySelectorAll("vm-player");

  allPlayers.forEach((player) => {
    player.addEventListener("vmReady", () => {
      setup(player, config);
    });
  });
}
