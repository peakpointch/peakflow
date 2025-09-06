import { wf } from "../../webflow/index.js";
import { asPrefix } from "../../utils/logger.js";
import Renderer from "../index.js";
import RenderFieldBase from "./base.js";
export default class ImageField extends RenderFieldBase {
    static read(htmlNode, attrName = "render") {
        this.assertHTML(htmlNode);
        const attr = Renderer.getAttributes(attrName);
        const image = htmlNode;
        const name = htmlNode.getAttribute(attr.field) || "";
        const instance = htmlNode.getAttribute(`data-${name}-instance`) || undefined;
        return {
            name,
            instance,
            value: image.src,
            type: "image",
            props: {
                src: image.src,
                alt: image.alt,
                sizes: image.sizes,
                srcset: ImageField.serializeSrcset(image.srcset),
                width: image.width,
                height: image.height,
                loading: image.loading || "lazy",
            },
            visibility: wf.isVisible(image),
            decorative: wf.hasAttr(image, attr.decorative),
        };
    }
    static deserializeSrcset(srcsetObj) {
        return Object.entries(srcsetObj).reduce((acc, [key, val]) => {
            return `${asPrefix(acc, ", ")}${val} ${key}`;
        }, "");
    }
    static serializeSrcset(srcset) {
        return srcset
            .split(",") // split by comma
            .map((s) => s.trim()) // remove extra whitespace
            .reduce((acc, entry) => {
            const [url, descriptor] = entry.split(/\s+/); // split by any whitespace
            if (url && descriptor) {
                acc[descriptor] = url;
            }
            return acc;
        }, {});
    }
    static assertField(renderField) {
        return renderField.type === "image";
    }
    /**
     * @throws TypeError if `htmlNode` is not an instance of `HTMLImageElement`
     */
    static assertHTML(htmlNode) {
        if (!(htmlNode instanceof HTMLImageElement)) {
            throw new TypeError(`HTML node is not of type "HTMLImageElement".`);
        }
        return htmlNode instanceof HTMLImageElement;
    }
}
export { ImageField };
