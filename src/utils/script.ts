export class Script {
  element: HTMLScriptElement;
  constructor(src: string) {
    this.element = document.createElement('script');
    this.element.src = src;
  }

  addAttribute(name: string, value: string) {
    this.element.setAttribute(name, value);
  }
}