/**
 * Returns the *"input-sync"* attribute as a CSSSelector.
 */
export declare const syncSelector: import("../attributeselector/attributeselector.js").AttributeSelector<string>;
/**
 * Sync all the inputs that belong to the same group.
 *
 * A group is defined by the `input-sync` attribute.
 *
 * All Inputs which belong to a group will have the same
 * group name as the `input-sync` attribute value.
 */
export declare function inputSync(container?: HTMLElement): void;
