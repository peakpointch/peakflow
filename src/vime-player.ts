import type { } from '@vime/core';

function getCustomPoster(player: HTMLVmPlayerElement): HTMLElement {
  const wrapper = player.parentElement;
  const poster = wrapper?.querySelector<HTMLElement>('[vm-custom-poster]');

  if (!poster) {
    throw new Error('Custom poster is missing.')
  }

  return poster;
}

function getPlayerControls(player: HTMLVmPlayerElement): HTMLVmControlsElement {
  return player.querySelector('vm-controls');
}

async function setup(player: HTMLVmPlayerElement): Promise<void> {
  const adapter = await player.getAdapter();
  const poster = getCustomPoster(player);
  const controls = getPlayerControls(player);

  poster.addEventListener('click', () => {
    adapter.play();
  });

  controls.style.opacity = '0';

  player.addEventListener('vmPausedChange', (event) => {
    switch (player.paused) {
      case true:
        poster.style.removeProperty('display');
        controls.style.opacity = '0';
        break;

      case false:
        poster.style.display = "none";
        controls.style.opacity = '1';
        break;
    }
  });
}

function initialize() {
  const allPlayers = document.querySelectorAll('vm-player');

  allPlayers.forEach((player) => {
    player.addEventListener('vmReady', () => {
      setup(player);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initialize();
});
