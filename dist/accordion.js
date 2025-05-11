import createAttribute from "@library/attributeselector";
const modalSelector = createAttribute('data-modal-element');
export default class Accordion {
    constructor(component) {
        this.isOpen = false;
        this.component = component;
        this.trigger = component.querySelector('[data-animate="trigger"]');
        this.uiTrigger = component.querySelector('[data-animate="ui-trigger"]');
        this.icon = component.querySelector('[data-animate="icon"]');
        this.uiTrigger.addEventListener("click", () => {
            this.toggle();
            // console.log("ACCORDION TRIGGER; OPEN:", this.isOpen);
        });
    }
    open() {
        if (!this.isOpen) {
            this.trigger.click();
            setTimeout(() => {
                this.icon.classList.add("is-open");
            }, 200);
            this.isOpen = true;
        }
    }
    close() {
        if (this.isOpen) {
            this.trigger.click();
            setTimeout(() => {
                this.icon.classList.remove("is-open");
            }, 200);
            this.isOpen = false;
        }
    }
    toggle() {
        if (this.isOpen) {
            this.close();
        }
        else {
            this.open();
        }
    }
    scrollIntoView() {
        let offset = 0;
        const scrollWrapper = this.component.closest(modalSelector('scroll'));
        const elementPosition = this.component.getBoundingClientRect().top;
        // Check if there is a scrollable wrapper (like a modal)
        if (scrollWrapper) {
            const wrapperPosition = scrollWrapper.getBoundingClientRect().top;
            offset = scrollWrapper.querySelector('[data-scroll-child="sticky"]').clientHeight; // Height of sticky element
            scrollWrapper.scrollBy({
                top: elementPosition - wrapperPosition - offset - 2,
                behavior: "smooth",
            });
        }
        else {
            // If no scrollable wrapper, scroll the window instead
            window.scrollTo({
                top: elementPosition + window.scrollY - offset - 2,
                behavior: "smooth",
            });
        }
    }
}
