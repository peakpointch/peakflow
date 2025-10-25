export class Accordion {
    constructor(component) {
        this.isOpen = false;
        this.onClickCallback = () => { };
        this.component = component;
        this.trigger = component.querySelector('[data-animate="trigger"]');
        this.uiTrigger = component.querySelector('[data-animate="ui-trigger"]');
        this.icon = component.querySelector('[data-animate="icon"]');
    }
    onClick(callback) {
        this.removeOnClick();
        this.onClickCallback = callback;
        this.uiTrigger.addEventListener("click", this.onClickCallback);
    }
    removeOnClick() {
        this.uiTrigger.removeEventListener("click", this.onClickCallback);
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
    scrollIntoView(scrollWrapper, offset = 0) {
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
