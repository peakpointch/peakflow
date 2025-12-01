import type { GlobalCal } from "@calcom/embed-core";
import type { BookerLayouts, EmbedThemeConfig } from "@calcom/embed-core/dist/src/types";
import type { PartialDeep } from "type-fest";
import { deepMerge } from "../utils";
import type {
  EventData as CalEventData,
  EventDataMap as CalEventDataMap,
} from "@calcom/embed-core/dist/src/sdk-action-manager";

type CalEventName = keyof CalEventDataMap;
type CalEventCallback<K extends CalEventName> = (data: CustomEvent<CalEventData<K>>) => void;

interface InitCalOptions<Namespace extends string = string> {
  namespace: Namespace;
  element?: HTMLElement;
  layout?: BookerLayouts;
  theme?: EmbedThemeConfig;
  colors?: {
    light?: Partial<CalCSSVars>;
    dark?: Partial<CalCSSVars>;
  };
}

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

interface CalDOMOptions {
  link: string;
  hideEventTypeDetails: boolean;
}

interface CalClientAttributes {
  id: "cal-id";
  link: "cal-link";
  hideEventTypeDetails: "cal-hide-event-details";
}

interface CalClientOptions {
  load: boolean;
}

export class CalClient<Namespace extends string = string> {
  public static defaultOptions: CalClientOptions = {
    load: true,
  };

  public attr: CalClientAttributes = {
    id: "cal-id",
    link: "cal-link",
    hideEventTypeDetails: "cal-hide-event-details",
  };
  public cal: GlobalCal;
  public initialized: boolean = false;
  public options: CalClientOptions;

  private constructor(options?: PartialDeep<CalClientOptions>) {
    this.options = deepMerge(CalClient.defaultOptions, options);
  }

  public static async create<T extends string = string>(
    options?: PartialDeep<CalClientOptions>,
  ): Promise<CalClient<T>> {
    const client = new CalClient(options);
    if (client.options.load) await client.loadCal();
    return client;
  }

  public static async _loadCal(): Promise<GlobalCal> {
    if (typeof window.Cal !== "undefined") return window.Cal;

    (function (windw: any, embedJS: string, action: string) {
      const p = (api: any, args: any) => {
        api.q.push(args);
      };
      const doc = windw.document;

      windw.Cal = function () {
        const cal = windw.Cal as GlobalCal;
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
          } else {
            p(cal, ar);
          }
          return;
        }

        p(cal, ar);
      };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    return window.Cal as GlobalCal;
  }

  public async loadCal(): Promise<void> {
    this.cal = await CalClient._loadCal();
    this.initialized = true;
  }

  public namespace(opts: InitCalOptions<Namespace>): void {
    if (!this.initialized)
      throw new Error(
        `Cal has not been initialized. Ensure the client is instantiated via the async factory method: await CalClient.create(...).`,
      );

    this.cal("init", opts.namespace, { origin: "https://cal.com" });

    const el = opts.element || document.querySelector<HTMLElement>(`[cal-id="${opts.namespace}"]`);
    if (!el) throw new Error("Embed container not found");

    const calLink = el.getAttribute("cal-link");
    if (!calLink) throw new Error(`Please specify a cal link`);

    const calDOMOptions: CalDOMOptions = {
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

  public on<E extends CalEventName>(
    namespace: Namespace,
    event: E,
    callback: CalEventCallback<E>,
  ): void {
    this.cal.ns[namespace]("on", {
      action: event,
      callback: callback,
    } as any);
  }

  public off<E extends CalEventName>(
    namespace: Namespace,
    event: E,
    callback: CalEventCallback<E>,
  ): void {
    this.cal.ns[namespace]("off", {
      action: event,
      callback: callback,
    } as any);
  }
}
