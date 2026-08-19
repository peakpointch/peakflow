import Script from "../utils/script.js";
import Stylesheet from "../utils/stylesheet.js";

interface VimeConfig {
  container: HTMLElement;
  customPoster: boolean;
}

export const vimeDefault: VimeConfig = {
  container: document.body,
  customPoster: false,
};

export async function loadVimeAssets(): Promise<void> {
  // Define all Vime assets
  const stylesheets = [
    new Stylesheet({ href: "https://cdn.jsdelivr.net/npm/@vime/core@^5/themes/default.css" }),
    new Stylesheet({ href: "https://cdn.jsdelivr.net/npm/@vime/core@^5/themes/light.css" }),
  ];

  const scripts = [
    new Script({
      src: "https://cdn.jsdelivr.net/npm/@vime/core@^5/dist/vime/vime.esm.js",
      type: "module",
      async: true,
    }),
  ];

  // Load all stylesheets (awaiting each one)
  for (const sheet of stylesheets) {
    await sheet.load();
  }

  // Load all scripts (awaiting each one)
  for (const script of scripts) {
    await script.load();
  }
}

const vimeSelector = {
  component: `[data-vime-component]`,
  customPoster: `[data-vime-element="custom-poster"], [vm-custom-poster]`,
} as const;

function getCustomPoster(player: HTMLVmPlayerElement): HTMLElement {
  const wrapper = player.parentElement;
  const poster = wrapper?.querySelector<HTMLElement>(vimeSelector.customPoster);

  if (!poster) {
    throw new Error(
      `Vime: Custom poster not found. Did you forget the "[vm-custom-poster]" attribute?`,
    );
  }

  return poster;
}

function disableAllCustomPosters(container: HTMLElement): void {
  const allPosters = container.querySelectorAll(vimeSelector.customPoster);
  allPosters.forEach((poster) => poster.classList.add("hide"));
}

function getPlayerControls(player: HTMLVmPlayerElement): HTMLVmControlsElement {
  const controls = player.querySelector("vm-controls");
  if (!controls) {
    throw new Error(`Vime: "vm-controls" element not found.`);
  }
  return controls;
}

async function vimeCustomPoster(player: HTMLVmPlayerElement): Promise<void> {
  const adapter = await player.getAdapter();
  const controls = getPlayerControls(player);
  const poster = getCustomPoster(player);

  if (!adapter) {
    throw new Error(`Vime: Failed to get adapter.`);
  }

  poster.addEventListener("click", () => {
    adapter.play();
  });

  controls.style.opacity = "0";

  player.addEventListener("vmPausedChange", () => {
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

export async function initVimePlayer(config: Partial<VimeConfig> = vimeDefault): Promise<void> {
  config.container = config.container || document.body;
  const cfg: VimeConfig = {
    container: config.container ?? vimeDefault.container,
    customPoster: config.customPoster ?? vimeDefault.customPoster,
  };

  await loadVimeAssets();
  const allPlayers = cfg.container.querySelectorAll("vm-player");

  if (!config.customPoster) {
    disableAllCustomPosters(cfg.container);
    return;
  }

  allPlayers.forEach((player) => {
    player.addEventListener("vmReady", () => {
      vimeCustomPoster(player);
    });
  });
}
