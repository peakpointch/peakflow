import createAttribute from "../attributeselector";
const marqueeSelector = createAttribute("data-marquee-element");
function setMarqueeSpeed(speed, trackOrComponent) {
  if (!trackOrComponent || !(trackOrComponent instanceof HTMLElement)) {
    throw new Error(`Get track element: Please pass a valid HTMLElement.`);
  }
  const track = getTrackElement(trackOrComponent);
  if (speed === "auto") {
    speed = parseInt(track.dataset.speed || "100", 10) || 100;
  }
  const distance = track.offsetWidth;
  const pixelsPerSecond = speed;
  const duration = distance / pixelsPerSecond;
  track.style.animationDuration = `${duration}s`;
  return duration;
}
function isComponentElement(element) {
  try {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error(`Can't verify an invalid HTMLElement.`);
    }
    let component = element;
    if (!component.matches(marqueeSelector("component"))) {
      throw new Error(`The passed element is not a marquee component. Tag a marquee component by adding the attribute '${marqueeSelector("component")}'.`);
    }
    return true;
  } catch (e) {
    console.error(`Verify marquee component: ${e.message}`);
    return false;
  }
}
function getTrackElement(trackOrComponent) {
  if (!trackOrComponent || !(trackOrComponent instanceof HTMLElement)) {
    throw new Error(`Get track element: Please pass a valid HTMLElement.`);
  }
  let track = trackOrComponent;
  if (track.matches(`${marqueeSelector("component")} ${marqueeSelector("track")}`)) {
    return trackOrComponent;
  }
  try {
    if (!track.matches(marqueeSelector("component"))) {
      throw new Error(`The passed element is neither a track element nor a marquee component element.`);
    }
    track = track.querySelector(marqueeSelector("track"));
    if (!track) {
      throw new Error(`The passed marquee component is missing the track element. Tag a track element by adding the attribute '${marqueeSelector("track")}'.`);
    }
    return track;
  } catch (e) {
    console.error(`Couldn't get marquee track: ${e.message}`);
  }
}
function getButtonElement(marquee) {
  if (!isComponentElement(marquee)) return;
  let button = marquee.querySelector(marqueeSelector("button"));
  if (button) return button;
  const marqueeId = marquee.getAttribute("data-marquee-id");
  if (!marqueeId) return void 0;
  button = document.querySelector(`${marqueeSelector("button")}[data-marquee-id="${marqueeId}"]`);
  return button ? button : void 0;
}
function initMarqueeEvents(marquee) {
  if (!isComponentElement(marquee)) return;
  const track = getTrackElement(marquee);
  const btn = getButtonElement(marquee);
  if (!btn || !track) return;
  function toggleState() {
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
function initializeMarquees(main) {
  const allMarquees = main.querySelectorAll(marqueeSelector("component"));
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
export {
  getButtonElement,
  getTrackElement,
  initMarqueeEvents,
  initializeMarquees,
  isComponentElement,
  marqueeSelector,
  setMarqueeSpeed
};
