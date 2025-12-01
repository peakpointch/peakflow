import { deepMerge } from "../utils";
export class CalClient {
    constructor(options) {
        this.attr = {
            id: "cal-id",
            link: "cal-link",
            hideEventTypeDetails: "cal-hide-event-details",
        };
        this.options = deepMerge(CalClient.defaultOptions, options);
    }
    static async loadCal() {
        if (typeof window.Cal !== "undefined")
            return window.Cal;
        (function (windw, embedJS, action) {
            const p = (api, args) => {
                api.q.push(args);
            };
            const doc = windw.document;
            windw.Cal = function () {
                const cal = windw.Cal;
                const ar = arguments;
                if (!cal.loaded) {
                    cal.ns = {};
                    cal.q = cal.q || [];
                    const script = doc.createElement("script");
                    script.src = embedJS;
                    doc.head.appendChild(script);
                    cal.loaded = true;
                }
                if (ar[0] === action) {
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
        })(window, "https://app.cal.com/embed/embed.js", "init");
        return window.Cal;
    }
    async loadCal() {
        this.cal = await CalClient.loadCal();
    }
    namespace(opts) {
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
            calLink: calDOMOptions.link,
        });
        this.cal.ns[opts.namespace]("ui", {
            hideEventTypeDetails: calDOMOptions.hideEventTypeDetails,
            layout: opts.layout || "month_view",
            cssVarsPerTheme: {
                light: opts.colors?.light,
                dark: opts.colors?.dark,
            },
            theme: opts.theme || "light",
        });
    }
    on(namespace, event, callback) {
        this.cal.ns[namespace]("on", {
            action: event,
            callback: callback,
        });
    }
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
