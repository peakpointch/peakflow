function setMarqueeSpeed(speed: number, track: HTMLElement): number {
  if (!track) return;

  const distance = track.offsetWidth;
  const pixelsPerSecond = speed; // Adjust this value to change the speed
  const duration = distance / pixelsPerSecond;
  track.style.animationDuration = `${duration}s`;
  return duration;
}

function handleMarquees(main: HTMLElement): void {
  const allMarquees = main.querySelectorAll<HTMLElement>(`[data-marquee-element="component"]`);
  allMarquees.forEach((marquee) => {
    const speed = parseInt(marquee.dataset.speed || "100");
    const track = marquee.querySelector<HTMLElement>(`[data-marquee-element="track"]`);
    const slides = Array.from(track.children);
    if (slides.length === 1) {
      const cloned = slides[0].cloneNode(true);
      track.appendChild(cloned);
    } else if (slides.length < 1 || !slides.length) {
      throw new Error(`Marquee: The track has no slides. skipping initialization.`);
    } else {
      return;
    }

    setMarqueeSpeed(speed, track);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const main = document.querySelector<HTMLElement>("main");
  handleMarquees(main);
});
