import { deepMerge, Script } from "../utils";
/**
 * Client class responsible for loading the Cal.com embed script and managing
 * calendar instances (namespaces) with specific configurations. This class acts
 * as the main interface for embedding and interacting with Cal.com.
 *
 * @template Namespace The union of all namespace strings managed by this client instance.
 */
export class CalClient {
    /**
     * This class must be instantiated via the static async create() factory method.
     *
     * @param options Optional partial configuration for the client instance itself.
     * @private
     */
    constructor(options) {
        /** Attribute names used by the client for DOM element discovery. */
        this.attr = {
            id: "cal-id",
            link: "cal-link",
            hideEventTypeDetails: "cal-hide-event-details",
        };
        /** Flag indicating whether the Cal.com SDK has been successfully loaded. */
        this.initialized = false;
        this.options = deepMerge(CalClient.defaultOptions, options);
    }
    /**
     * Creates a CalClient instance.
     * This method loads the SDK and initializes the first namespace if provided.
     *
     * @template T The specific string literal for the initial namespace identifier.
     * @param clientOptions Optional configuration for the CalClient itself (e.g., `{ load: false }`).
     * @param initialNamespaceOptions Optional configuration to immediately initialize the first namespace/embed.
     * @returns A promise that resolves with a fully initialized CalClient instance.
     */
    static async create(options) {
        const client = new CalClient(options);
        if (client.options.load)
            await client.loadCal();
        return client;
    }
    /**
     * Loads Cal into the window scope using the Cal.com snippet logic.
     *
     * @returns A promise that resolves with the GlobalCal instance when loaded.
     * @private
     */
    static async _loadCal() {
        if (typeof window.Cal !== "undefined")
            return window.Cal;
        (function (windw) {
            const p = (api, args) => {
                api.q.push(args);
            };
            windw.Cal = function () {
                const cal = windw.Cal;
                const ar = arguments;
                if (!cal.loaded) {
                    throw CalClient.errors.notInitialized;
                }
                if (ar[0] === "init") {
                    const api = function () {
                        p(api, arguments);
                    };
                    const namespace = ar[1];
                    //@ts-ignore
                    api.q = api.q || [];
                    if (typeof namespace === "string") {
                        cal.ns[namespace] = cal.ns[namespace] || api;
                        p(cal.ns[namespace], ar);
                        p(cal, ["initNamespace", namespace]);
                    }
                    else {
                        p(cal, ar);
                    }
                    return;
                }
                p(cal, ar);
            };
        })(window);
        const cal = window.Cal;
        if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            const script = new Script({ src: "https://app.cal.com/embed/embed.js", async: true });
            await script.load();
            cal.loaded = true;
        }
        return window.Cal;
    }
    /**
     * Loads the global Cal instance, initializing the SDK.
     * Use this method to load Cal into your client, if not instantiated via await CalClient.create()
     *
     * @returns A promise that resolves when the Cal.com SDK is loaded.
     */
    async loadCal() {
        this.cal = await CalClient._loadCal();
        this.initialized = true;
    }
    /**
     * Initializes a new Cal.com namespace, configures the inline embed,
     * and applies UI options like theme and custom CSS variables.
     *
     * @param opts Configuration options for the namespace and embed container.
     * @throws {Error} If the client has not been initialized (i.e., `loadCal` has not completed).
     */
    namespace(opts) {
        if (!this.initialized)
            throw CalClient.errors.notInitialized;
        this.cal("init", opts.namespace, { origin: "https://cal.com" });
        const el = opts.element || document.querySelector(`[cal-id="${opts.namespace}"]`);
        if (!el)
            throw new Error("Embed container not found");
        const calLink = el.getAttribute("cal-link");
        if (!calLink)
            throw new Error(`Please specify a cal link`);
        const calDOMOptions = {
            link: calLink,
            hideEventTypeDetails: el.getAttribute("cal-hide-event-details") === "true",
        };
        this.cal.ns[opts.namespace]("inline", {
            elementOrSelector: el,
            config: { layout: opts.layout || "month_view" },
            calLink: opts.link || calDOMOptions.link,
        });
        this.cal.ns[opts.namespace]("ui", {
            hideEventTypeDetails: opts.hideEventTypeDetails || calDOMOptions.hideEventTypeDetails,
            layout: opts.layout || "month_view",
            cssVarsPerTheme: {
                light: opts.colors?.light,
                dark: opts.colors?.dark,
            },
            theme: opts.theme || "light",
        });
    }
    /**
     * Initializes multiple Cal.com namespaces with the same configuration.
     * It iterates through the provided array of namespaces and calls `this.namespace()`
     * for each one using the common options.
     *
     * @param namespaces An array of unique namespace identifiers (strings) to initialize.
     * @param opts Configuration options common to all namespaces (excluding the namespace identifier).
     * @throws {Error} If the client has not been initialized.
     */
    namespaceAll(namespaces, opts) {
        if (!this.initialized)
            throw CalClient.errors.notInitialized;
        for (const namespace of namespaces) {
            const fullOpts = {
                ...opts,
                namespace: namespace,
            };
            this.namespace(fullOpts);
        }
    }
    /**
     * Registers an event listener on a specific Cal.com namespace.
     *
     * @template E The specific Cal.com event name being listened for.
     * @param namespace The namespace ID to attach the listener to.
     * @param event The Cal.com event name (e.g., 'loaded', 'dateSelected').
     * @param callback The function to execute when the event fires.
     * @throws {Error} If the client has not been initialized.
     */
    on(namespace, event, callback) {
        this.cal.ns[namespace]("on", {
            action: event,
            callback: callback,
        });
    }
    /**
     * Removes an event listener from a specific Cal.com namespace.
     *
     * @template E The specific Cal.com event name being removed.
     * @param namespace The namespace ID to remove the listener from.
     * @param event The Cal.com event name.
     * @param callback The original function reference passed to the `on` method.
     * @throws {Error} If the client has not been initialized.
     */
    off(namespace, event, callback) {
        this.cal.ns[namespace]("off", {
            action: event,
            callback: callback,
        });
    }
}
CalClient.defaultOptions = {
    load: true,
};
/** Common errors */
CalClient.errors = {
    notInitialized: new Error(`This CalClient instance is not ready. Ensure you are instantiating it with the required factory pattern: await CalClient.create()`),
};
