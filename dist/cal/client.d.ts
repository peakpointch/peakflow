import type { GlobalCal } from "@calcom/embed-core";
import type { BookerLayouts, EmbedThemeConfig } from "@calcom/embed-core/dist/src/types";
import type { PartialOptions } from "../typeutils/index.js";
import type { EventData as CalEventData, EventDataMap as CalEventDataMap } from "@calcom/embed-core/dist/src/sdk-action-manager";
/** The string literal of all available Cal.com embed event names. */
type CalEventName = keyof CalEventDataMap;
/**
 * Type for a callback function registered to a Cal.com embed event.
 * @template K The name of the Cal.com event.
 */
type CalEventCallback<K extends CalEventName> = (data: CustomEvent<CalEventData<K>>) => void;
/** Standard CSS variables used by the Cal.com embed for theming. */
interface CalCSSVars {
    "cal-brand": string;
    "cal-brand-accent": string;
    "cal-brand-emphasis": string;
    "cal-brand-subtle": string;
    "cal-brand-text": string;
    "cal-bg": string;
    "cal-bg-attention": string;
    "cal-bg-brand": string;
    "cal-bg-brand-emphasis": string;
    "cal-bg-brand-muted": string;
    "cal-bg-dark-error": string;
    "cal-bg-emphasis": string;
    "cal-bg-error": string;
    "cal-bg-info": string;
    "cal-bg-inverted": string;
    "cal-bg-launch-dark": string;
    "cal-bg-muted": string;
    "cal-bg-primary": string;
    "cal-bg-primary-emphasis": string;
    "cal-bg-primary-muted": string;
    "cal-bg-semantic-info-subtle": string;
    "cal-bg-semantic-info-emphasis": string;
    "cal-bg-semantic-success-subtle": string;
    "cal-bg-semantic-success-emphasis": string;
    "cal-bg-semantic-attention-subtle": string;
    "cal-bg-semantic-attention-emphasis": string;
    "cal-bg-semantic-error-subtle": string;
    "cal-bg-semantic-error-emphasis": string;
    "cal-bg-success": string;
    "cal-bg-subtle": string;
    "cal-bg-visualization-1-emphasis": string;
    "cal-bg-visualization-1-subtle": string;
    "cal-bg-visualization-2-emphasis": string;
    "cal-bg-visualization-2-subtle": string;
    "cal-bg-visualization-3-emphasis": string;
    "cal-bg-visualization-3-subtle": string;
    "cal-bg-visualization-4-emphasis": string;
    "cal-bg-visualization-4-subtle": string;
    "cal-bg-visualization-5-emphasis": string;
    "cal-bg-visualization-5-subtle": string;
    "cal-bg-visualization-6-emphasis": string;
    "cal-bg-visualization-6-subtle": string;
    "cal-bg-visualization-7-emphasis": string;
    "cal-bg-visualization-7-subtle": string;
    "cal-border": string;
    "cal-border-booker": string;
    "cal-border-emphasis": string;
    "cal-border-error": string;
    "cal-border-muted": string;
    "cal-border-semantic-error": string;
    "cal-border-semantic-attention-subtle": string;
    "cal-border-semantic-error-subtle": string;
    "cal-border-subtle": string;
    "cal-text": string;
    "cal-text-attention": string;
    "cal-text-emphasis": string;
    "cal-text-error": string;
    "cal-text-info": string;
    "cal-text-inverted": string;
    "cal-text-muted": string;
    "cal-text-semantic-info": string;
    "cal-text-semantic-success": string;
    "cal-text-semantic-attention": string;
    "cal-text-semantic-error": string;
    "cal-text-subtle": string;
    "cal-text-success": string;
    "cal-text-visualization-1": string;
    "cal-text-visualization-2": string;
    "cal-text-visualization-3": string;
    "cal-text-visualization-4": string;
    "cal-text-visualization-5": string;
    "cal-text-visualization-6": string;
    "cal-text-visualization-7": string;
}
/** Maps user-facing property names to the actual HTML data attributes used by the Cal.com embed. */
export interface CalClientAttributes {
    id: "cal-id";
    link: "cal-link";
    hideEventTypeDetails: "cal-hide-event-details";
}
/**
 * Options required to initialize a specific Cal.com namespace and embed container.
 * @template Namespace The specific string literal for the namespace identifier.
 */
interface InitCalOptions<Namespace extends string = string> {
    /** The unique namespace identifier for the Cal.com instance (e.g., 'main-embed'). */
    namespace: Namespace;
    /** Optional: The path to the meeting `{slug}/{meeting-id}`, e.g. "your-company/30-minute-meeting". If provided, overrides the `cal-link` DOM attribute. */
    link?: string;
    /** Optional: Hide event type details at the top of the iframe. Default: false. If provided, overrides the `cal-hide-event-details` DOM attribute. */
    hideEventTypeDetails?: boolean;
    /** Optional: The HTMLElement to embed the calendar into. If not provided, it looks for an element using the `cal-id={namespace}` attribute. */
    element?: HTMLElement;
    /** Optional: The display layout for the embed (e.g., 'month_view', 'date_view'). */
    layout?: BookerLayouts;
    /** Optional: The theme of the embed ('light' or 'dark'). */
    theme?: EmbedThemeConfig;
    /** Optional: Custom CSS variables to override default Cal.com colors for light and dark themes. */
    colors?: {
        light?: Partial<CalCSSVars>;
        dark?: Partial<CalCSSVars>;
    };
}
/** Configuration options for initializing multiple Cal.com namespaces with common settings. */
type CommonInitCalOptions = Omit<InitCalOptions<string>, "namespace" | "element">;
/** General options for configuring the behavior of the CalClient instance itself. */
interface CalClientOptions {
    /** If true, the Cal.com SDK script will be automatically loaded upon client creation. */
    load: boolean;
}
/**
 * Client class responsible for loading the Cal.com embed script and managing
 * calendar instances (namespaces) with specific configurations. This class acts
 * as the main interface for embedding and interacting with Cal.com.
 *
 * @template Namespace The union of all namespace strings managed by this client instance.
 */
export declare class CalClient<Namespace extends string = string> {
    static defaultOptions: CalClientOptions;
    /** Attribute names used by the client for DOM element discovery. */
    attr: CalClientAttributes;
    /** The global Cal.com instance loaded onto the window object. */
    cal: GlobalCal;
    /** Flag indicating whether the Cal.com SDK has been successfully loaded. */
    initialized: boolean;
    /** The final resolved options for the current client instance. */
    options: CalClientOptions;
    /** Common errors */
    private static errors;
    /**
     * This class must be instantiated via the static async create() factory method.
     *
     * @param options Optional partial configuration for the client instance itself.
     * @private
     */
    private constructor();
    /**
     * Creates a CalClient instance.
     * This method loads the SDK and initializes the first namespace if provided.
     *
     * @template T The specific string literal for the initial namespace identifier.
     * @param clientOptions Optional configuration for the CalClient itself (e.g., `{ load: false }`).
     * @param initialNamespaceOptions Optional configuration to immediately initialize the first namespace/embed.
     * @returns A promise that resolves with a fully initialized CalClient instance.
     */
    static create<T extends string = string>(options?: PartialOptions<CalClientOptions>): Promise<CalClient<T>>;
    /**
     * Loads Cal into the window scope using the Cal.com snippet logic.
     *
     * @returns A promise that resolves with the GlobalCal instance when loaded.
     * @private
     */
    static _loadCal(): Promise<GlobalCal>;
    /**
     * Loads the global Cal instance, initializing the SDK.
     * Use this method to load Cal into your client, if not instantiated via await CalClient.create()
     *
     * @returns A promise that resolves when the Cal.com SDK is loaded.
     */
    loadCal(): Promise<void>;
    /**
     * Initializes a new Cal.com namespace, configures the inline embed,
     * and applies UI options like theme and custom CSS variables.
     *
     * @param opts Configuration options for the namespace and embed container.
     * @throws {Error} If the client has not been initialized (i.e., `loadCal` has not completed).
     */
    namespace(opts: InitCalOptions<Namespace>): void;
    /**
     * Initializes multiple Cal.com namespaces with the same configuration.
     * It iterates through the provided array of namespaces and calls `this.namespace()`
     * for each one using the common options.
     *
     * @param namespaces An array of unique namespace identifiers (strings) to initialize.
     * @param opts Configuration options common to all namespaces (excluding the namespace identifier).
     * @throws {Error} If the client has not been initialized.
     */
    namespaceAll(namespaces: Namespace[], opts: CommonInitCalOptions): void;
    /**
     * Registers an event listener on a specific Cal.com namespace.
     *
     * @template E The specific Cal.com event name being listened for.
     * @param namespace The namespace ID to attach the listener to.
     * @param event The Cal.com event name (e.g., 'loaded', 'dateSelected').
     * @param callback The function to execute when the event fires.
     * @throws {Error} If the client has not been initialized.
     */
    on<E extends CalEventName>(namespace: Namespace, event: E, callback: CalEventCallback<E>): void;
    /**
     * Removes an event listener from a specific Cal.com namespace.
     *
     * @template E The specific Cal.com event name being removed.
     * @param namespace The namespace ID to remove the listener from.
     * @param event The Cal.com event name.
     * @param callback The original function reference passed to the `on` method.
     * @throws {Error} If the client has not been initialized.
     */
    off<E extends CalEventName>(namespace: Namespace, event: E, callback: CalEventCallback<E>): void;
}
export {};
