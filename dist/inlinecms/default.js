import { inlineCms } from "./index.js";
export default function inlineCmsDefault() {
    inlineCms({
        origins: "[data-inlinecms-origin], [data-inlinecms-component], [inlinecms], [data-inlinecms], [data-cms-unpack]",
        doc: document.body,
    });
}
