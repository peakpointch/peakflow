import RenderFieldBase from "./base.js";
import type { HTMLRenderNode } from "../dom/index.js";
import type { RenderField, FilterAttributes, PropsFromFilterAttributes } from "../types.js";
/**
 * Mapped srcset object.
 */
export type ImageSrcset = Record<string, string>;
export default class ImageField<F extends FilterAttributes<keyof F & string> = {}> extends RenderFieldBase {
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
    static read(htmlNode: HTMLRenderNode, attrName?: string): ImageField;
    static deserializeSrcset(srcsetObj: ImageSrcset): string;
    static serializeSrcset(srcset: string): ImageSrcset;
    static assertField(renderField: RenderField): renderField is ImageField;
    /**
     * @throws TypeError if `htmlNode` is not an instance of `HTMLImageElement`
     */
    static assertHTML(htmlNode: HTMLRenderNode): htmlNode is HTMLImageElement;
}
export { ImageField };
