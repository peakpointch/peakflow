/**
 * A `HTMLRenderNode` is the DOM element where a `RenderNode` is rendered.
 *
 * These elements are marked with `data-render-*` attributes, which tell the
 * `Renderer` where in the DOM the data from a `RenderField` or `RenderBlock`
 * should be rendered.
 *
 * In other words, a `HTMLRenderNode` is the *target container* for a
 * `RenderNode`’s content.
 */
export declare class HTMLRenderNode extends HTMLElement {
}
export declare class HTMLRenderBlock extends HTMLRenderNode {
}
export declare class HTMLRenderField extends HTMLRenderNode {
}
