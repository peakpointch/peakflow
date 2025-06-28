export class Script {
    constructor(src) {
        this.element = document.createElement('script');
        this.element.src = src;
    }
    addAttribute(name, value) {
        this.element.setAttribute(name, value);
    }
}
