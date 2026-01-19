import { inlineCms } from "./index";

export default function inlineCmsDefault(): void {
  inlineCms({
    origins:
      "[data-inlinecms-origin], [data-inlinecms-component], [inlinecms], [data-inlinecms], [data-cms-unpack]",
    doc: document.body,
  });
}
