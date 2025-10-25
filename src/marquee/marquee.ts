import Selector from "../attributeselector/index.js";

export type MarqueeElement = "component" | "track" | "button";

export const marqueeSelector = Selector.attr<MarqueeElement>("data-marquee-element");

export function setMarqueeSpeed(speed: number | "auto", trackOrComponent: HTMLElement): number {
  if (!trackOrComponent || !(trackOrComponent instanceof HTMLElement)) {
    throw new Error(`Get track element: Please pass a valid HTMLElement.`);
  }

  const track = getTrackElement(trackOrComponent);
  if (speed === "auto") {
    speed = parseInt(track.dataset.speed || "100", 10) || 100;
  }
  const distance = track.offsetWidth;
  const pixelsPerSecond = speed; // Adjust this value to change the speed
  const duration = distance / pixelsPerSecond;
  track.style.animationDuration = `${duration}s`;
  return duration;
}

export function isComponentElement(element: HTMLElement): element is HTMLElement {
  try {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error(`Can't verify an invalid HTMLElement.`);
    }

    let component = element as HTMLElement;
    if (!component.matches(marqueeSelector("component"))) {
      throw new Error(
        `The passed element is not a marquee component. Tag a marquee component by adding the attribute '${marqueeSelector("component")}'.`,
      );
    }

    return true;
  } catch (e) {
    console.error(`Verify marquee component: ${e.message}`);
    return false;
  }
}

export function getTrackElement(trackOrComponent: HTMLElement): HTMLElement {
  if (!trackOrComponent || !(trackOrComponent instanceof HTMLElement)) {
    throw new Error(`Get track element: Please pass a valid HTMLElement.`);
  }

  let track = trackOrComponent as HTMLElement;
  if (track.matches(`${marqueeSelector("component")} ${marqueeSelector("track")}`)) {
    return trackOrComponent;
  }

  try {
    if (!track.matches(marqueeSelector("component"))) {
      throw new Error(
        `The passed element is neither a track element nor a marquee component element.`,
      );
    }
    track = track.querySelector(marqueeSelector("track"));
    if (!track) {
      throw new Error(
        `The passed marquee component is missing the track element. Tag a track element by adding the attribute '${marqueeSelector("track")}'.`,
      );
    }
    return track;
  } catch (e) {
    console.error(`Couldn't get marquee track: ${e.message}`);
  }
}

export function getButtonElement<T extends HTMLElement = HTMLElement>(
  marquee: HTMLElement,
): T | undefined {
  if (!isComponentElement(marquee)) return;

  let button = marquee.querySelector<T>(marqueeSelector("button"));
  if (button) return button;

  const marqueeId = marquee.getAttribute("data-marquee-id");
  if (!marqueeId) return undefined;

  button = document.querySelector<T>(
    `${marqueeSelector("button")}[data-marquee-id="${marqueeId}"]`,
  );
  return button ? button : undefined;
}

export function initMarqueeEvents(marquee: HTMLElement): void {
  if (!isComponentElement(marquee)) return;
  const track = getTrackElement(marquee);
  const btn = getButtonElement<HTMLElement>(marquee);

  if (!btn || !track) return;

  function toggleState(): void {
    if (marquee.getAttribute("data-marquee-paused") === "true") {
      marquee.setAttribute("data-marquee-paused", "false");
      btn.innerText = "pause";
    } else {
      marquee.setAttribute("data-marquee-paused", "true");
      btn.innerText = "play";
    }
  }

  btn.addEventListener("click", toggleState);
}

export function initializeMarquees(main: HTMLElement): void {
  const allMarquees = main.querySelectorAll<HTMLElement>(marqueeSelector("component"));
  allMarquees.forEach((marquee) => {
    if (!isComponentElement(marquee)) return;

    const speed = parseInt(marquee.dataset.speed || "100");
    const track = getTrackElement(marquee);
    const slides = Array.from(track.children);
    if (slides.length === 1) {
      const cloned = slides[0].cloneNode(true);
      track.appendChild(cloned);
    } else if (slides.length < 1 || !slides.length) {
      console.warn(`Marquee: The track has no slides. Skipping initialization.`);
    }

    initMarqueeEvents(marquee);
    setMarqueeSpeed(speed, track);
  });
}
