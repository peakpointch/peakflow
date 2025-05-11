export async function loadCal(namespace) {
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
    const Cal = window.Cal;
    Cal("init", namespace, { origin: "https://cal.com" });
    return Cal;
}
