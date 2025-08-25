import Script from "../utils/script";
import Stylesheet from "../utils/stylesheet";
export const defaultConfig = {
    customPoster: false,
};
export async function loadVimeAssets() {
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
function getCustomPoster(player) {
    const wrapper = player.parentElement;
    const poster = wrapper?.querySelector("[vm-custom-poster]");
    if (!poster) {
        throw new Error(`Vime: Custom poster not found. Did you forget the "[vm-custom-poster]" attribute?`);
    }
    return poster;
}
function getPlayerControls(player) {
    const controls = player.querySelector("vm-controls");
    if (!controls) {
        throw new Error(`Vime: "vm-controls" element not found.`);
    }
    return controls;
}
async function setup(player, config) {
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
        if (!config.customPoster)
            return;
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
export async function initVimePlayer(config = defaultConfig) {
    await loadVimeAssets();
    const allPlayers = document.querySelectorAll("vm-player");
    allPlayers.forEach((player) => {
        player.addEventListener("vmReady", () => {
            setup(player, config);
        });
    });
}
