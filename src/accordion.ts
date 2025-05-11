import createAttribute from "@library/attributeselector";

type ModalElement = 'scroll' | 'sticky-top' | 'sticky-bottom';

const modalSelector = createAttribute<ModalElement>('data-modal-element');

export default class Accordion {
  public component: HTMLElement;
  public trigger: HTMLElement;
  public uiTrigger: HTMLElement;
  public isOpen: boolean = false;
  private icon: HTMLElement;

  constructor(component: HTMLElement) {
    this.component = component;
    this.trigger = component.querySelector('[data-animate="trigger"]')!;
    this.uiTrigger = component.querySelector('[data-animate="ui-trigger"]')!;
    this.icon = component.querySelector('[data-animate="icon"]')!;

    this.uiTrigger.addEventListener("click", () => {
      this.toggle();
      // console.log("ACCORDION TRIGGER; OPEN:", this.isOpen);
    });
  }

  public open() {
    if (!this.isOpen) {
      this.trigger.click();
      setTimeout(() => {
        this.icon.classList.add("is-open");
      }, 200);
      this.isOpen = true;
    }
  }

  public close() {
    if (this.isOpen) {
      this.trigger.click();
      setTimeout(() => {
        this.icon.classList.remove("is-open");
      }, 200);
      this.isOpen = false;
    }
  }

  public toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public scrollIntoView(): void {
    let offset = 0;
    const scrollWrapper: HTMLElement | null = this.component.closest(
      modalSelector('scroll')
    );
    const elementPosition = this.component.getBoundingClientRect().top;

    // Check if there is a scrollable wrapper (like a modal)
    if (scrollWrapper) {
      const wrapperPosition = scrollWrapper.getBoundingClientRect().top;
      offset = scrollWrapper.querySelector('[data-scroll-child="sticky"]')!.clientHeight; // Height of sticky element

      scrollWrapper.scrollBy({
        top: elementPosition - wrapperPosition - offset - 2,
        behavior: "smooth",
      });
    } else {
      // If no scrollable wrapper, scroll the window instead
      window.scrollTo({
        top: elementPosition + window.scrollY - offset - 2,
        behavior: "smooth",
      });
    }
  }
}
