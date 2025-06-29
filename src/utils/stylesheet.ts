export default class Stylesheet {
  element: HTMLLinkElement;
  constructor(href: string) {
    this.element = document.createElement('link');
    this.element.setAttribute('rel', 'stylesheet');
    this.element.href = href;
  }

  addAttribute(name: string, value: string) {
    this.element.setAttribute(name, value);
  }
}
