export class Stylesheet {
    constructor(href) {
        this.element = document.createElement('link');
        this.element.setAttribute('rel', 'stylesheet');
        this.element.href = href;
    }
    addAttribute(name, value) {
        this.element.setAttribute(name, value);
    }
}
