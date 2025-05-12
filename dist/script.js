class Script {
  constructor(src) {
    this.element = document.createElement("script");
    this.element.src = src;
  }
  addAttribute(name, value) {
    this.element.setAttribute(name, value);
  }
}
class Stylesheet {
  constructor(href) {
    this.element = document.createElement("link");
    this.element.setAttribute("rel", "stylesheet");
    this.element.href = href;
  }
  addAttribute(name, value) {
    this.element.setAttribute(name, value);
  }
}
export {
  Script,
  Stylesheet
};
