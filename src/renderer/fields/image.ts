import { wf } from "../../webflow/index.js";
import { asPrefix } from "../../utils/logger.js";

import Renderer from "../index.js";
import RenderFieldBase from "./base.js";
import type { HTMLRenderNode } from "../dom/index.js";
import type { RenderField, FilterAttributes, PropsFromFilterAttributes } from "../types.js";

/**
 * Mapped srcset object.
 */
export type ImageSrcset = Record<string, string>;

export default class ImageField<
  F extends FilterAttributes<keyof F & string> = {},
> extends RenderFieldBase {
  type: "image";
  props: PropsFromFilterAttributes<F> & {
    src: string;
    alt?: string;
    sizes?: string;
    srcset?: ImageSrcset;
    width?: number;
    height?: number;
    loading: "eager" | "lazy";
  };

  public static read(htmlNode: HTMLRenderNode, attrName: string = "render"): ImageField {
    this.assertHTML(htmlNode);
    const attr = Renderer.getAttributes(attrName);
    const image = htmlNode as HTMLImageElement;
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

  public static deserializeSrcset(srcsetObj: ImageSrcset): string {
    return Object.entries(srcsetObj).reduce((acc, [key, val]) => {
      return `${asPrefix(acc, ", ")}${val} ${key}`;
    }, "");
  }

  public static serializeSrcset(srcset: string): ImageSrcset {
    return srcset
      .split(",") // split by comma
      .map((s) => s.trim()) // remove extra whitespace
      .reduce((acc: ImageSrcset, entry) => {
        const [url, descriptor] = entry.split(/\s+/); // split by any whitespace
        if (url && descriptor) {
          acc[descriptor] = url;
        }
        return acc;
      }, {});
  }

  public static assertField(renderField: RenderField): renderField is ImageField {
    return renderField.type === "image";
  }

  /**
   * @throws TypeError if `htmlNode` is not an instance of `HTMLImageElement`
   */
  public static assertHTML(htmlNode: HTMLRenderNode): htmlNode is HTMLImageElement {
    if (!(htmlNode instanceof HTMLImageElement)) {
      throw new TypeError(`HTML node is not of type "HTMLImageElement".`);
    }
    return htmlNode instanceof HTMLImageElement;
  }
}

export { ImageField };
