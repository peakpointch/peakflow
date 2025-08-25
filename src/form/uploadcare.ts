import { logPrefix } from "../utils/logger.js";
import * as UC from "@uploadcare/file-uploader";
import ar from "@uploadcare/file-uploader/locales/file-uploader/ar.js";
import az from "@uploadcare/file-uploader/locales/file-uploader/az.js";
import ca from "@uploadcare/file-uploader/locales/file-uploader/ca.js";
import cs from "@uploadcare/file-uploader/locales/file-uploader/cs.js";
import da from "@uploadcare/file-uploader/locales/file-uploader/da.js";
import de from "@uploadcare/file-uploader/locales/file-uploader/de.js";
import el from "@uploadcare/file-uploader/locales/file-uploader/el.js";
import en from "@uploadcare/file-uploader/locales/file-uploader/en.js";
import es from "@uploadcare/file-uploader/locales/file-uploader/es.js";
import et from "@uploadcare/file-uploader/locales/file-uploader/et.js";
import fi from "@uploadcare/file-uploader/locales/file-uploader/fi.js";
import fr from "@uploadcare/file-uploader/locales/file-uploader/fr.js";
import he from "@uploadcare/file-uploader/locales/file-uploader/he.js";
import hy from "@uploadcare/file-uploader/locales/file-uploader/hy.js";
import is from "@uploadcare/file-uploader/locales/file-uploader/is.js";
import it from "@uploadcare/file-uploader/locales/file-uploader/it.js";
import ja from "@uploadcare/file-uploader/locales/file-uploader/ja.js";
import ka from "@uploadcare/file-uploader/locales/file-uploader/ka.js";
import kk from "@uploadcare/file-uploader/locales/file-uploader/kk.js";
import ko from "@uploadcare/file-uploader/locales/file-uploader/ko.js";
import lv from "@uploadcare/file-uploader/locales/file-uploader/lv.js";
import nb from "@uploadcare/file-uploader/locales/file-uploader/nb.js";
import nl from "@uploadcare/file-uploader/locales/file-uploader/nl.js";
import pl from "@uploadcare/file-uploader/locales/file-uploader/pl.js";
import pt from "@uploadcare/file-uploader/locales/file-uploader/pt.js";
import ro from "@uploadcare/file-uploader/locales/file-uploader/ro.js";
import ru from "@uploadcare/file-uploader/locales/file-uploader/ru.js";
import sk from "@uploadcare/file-uploader/locales/file-uploader/sk.js";
import sr from "@uploadcare/file-uploader/locales/file-uploader/sr.js";
import sv from "@uploadcare/file-uploader/locales/file-uploader/sv.js";
import tr from "@uploadcare/file-uploader/locales/file-uploader/tr.js";
import uk from "@uploadcare/file-uploader/locales/file-uploader/uk.js";
import vi from "@uploadcare/file-uploader/locales/file-uploader/vi.js";
import zh from "@uploadcare/file-uploader/locales/file-uploader/zh.js";

export const UCLocaleMap = {
  ar,
  az,
  ca,
  cs,
  da,
  de,
  el,
  en,
  es,
  et,
  fi,
  fr,
  he,
  hy,
  is,
  it,
  ja,
  ka,
  kk,
  ko,
  lv,
  nb,
  nl,
  pl,
  pt,
  ro,
  ru,
  sk,
  sr,
  sv,
  tr,
  uk,
  vi,
  zh,
} as const;
export type UCLocale = keyof typeof UCLocaleMap;
type UCChangeEvent = UC.EventMap["change"];

const UCAttr = {
  component: "data-uploadcare-component",
  field: "data-uploadcare-field",
} as const;

const UCSelector = {
  component: `[${UCAttr.component}]`,
  fields: {
    url: `[${UCAttr.field}="url"]`,
    uuid: `[${UCAttr.field}="uuid"]`,
  },
} as const;

interface UCFileUploaderConfig {
  name?: string;
  component: HTMLElement;
  locale: UCLocale;
  /** Form fields in the uploading form where the values get whatever chatgpt improve this */
  fields: {
    [T in keyof (typeof UCSelector)["fields"]]: HTMLInputElement;
  };
}

function initUCConfig(config: Partial<UCFileUploaderConfig>): UCFileUploaderConfig {
  const defaultFields = Object.fromEntries(
    Object.entries(UCSelector.fields).map(([key, selector]) => {
      const el = config.component!.querySelector<HTMLInputElement>(selector);
      if (!el) {
        throw new Error(`Uploadcare: Default field with selector "${selector}" not found.`);
      }
      return [key, el];
    }),
  ) as UCFileUploaderConfig["fields"];

  const cfg: UCFileUploaderConfig = {
    name: config.name,
    component: config.component ?? document.body,
    locale: config.locale ?? "en",
    fields: {
      ...defaultFields,
      ...config.fields, // override defaults if provided
    },
  };

  const prefix = logPrefix("Uploadcare", cfg.name);

  if (!cfg.component) {
    throw new Error(`${prefix}Component element for file uploader not found.`);
  }

  return cfg;
}

function initUCEvents(ctxProvider: Element, prefix: string, cfg: UCFileUploaderConfig): void {
  ctxProvider.addEventListener("change", (event) => {
    const UCEvent = event as UCChangeEvent;
    const files = UCEvent.detail.successEntries;

    let uuidArray = files.map((file) => file.uuid);
    let cdnUrlArray = files.map((file) => file.cdnUrl);

    const uuidField = cfg.fields.uuid;
    if (uuidField) {
      uuidField.value = uuidArray.join(", ");
      uuidField.dispatchEvent(new Event("change", { bubbles: true }));
    }

    const urlField = cfg.fields.url;
    if (!urlField) {
      throw new Error(`${prefix}URL field not found.`);
    } else {
      urlField.value = cdnUrlArray.join(", ");
      urlField.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
}

/**
 * Initialize Uploadcare file-uploader instance and attach the files to a form field.
 */
export function initUCFileUploader(config: Partial<UCFileUploaderConfig>): void {
  const cfg = initUCConfig(config);
  const prefix = logPrefix("Uploadcare", cfg.name);

  UC.defineLocale(cfg.locale, UCLocaleMap[cfg.locale]);
  UC.defineComponents(UC);

  // Submit files
  const ctxProvider = cfg.component.querySelector("uc-upload-ctx-provider");
  if (!ctxProvider) {
    throw new Error(
      `${prefix}Element "uc-upload-ctx-provider" not found inside component element.`,
    );
  }

  initUCEvents(ctxProvider, prefix, cfg);
}

export function initUploadcare(
  container: HTMLElement,
  config: Partial<Omit<UCFileUploaderConfig, "name" | "component">>,
): void {
  const prefix = logPrefix("Uploadcare");

  const components = container.querySelectorAll<HTMLElement>(UCSelector.component);
  if (!components.length) {
    console.warn(
      `${prefix}No component elements found inside container. Tag components with the "${UCSelector.component}" attribute.`,
    );
  }

  components.forEach((component) => {
    const newConfig: UCFileUploaderConfig = {
      ...(config as UCFileUploaderConfig),
      name: component.getAttribute(UCAttr.component) ?? undefined,
      component: component,
    };
    initUCFileUploader(newConfig);
  });
}

export function initUploadcareDefault(): void {
  return initUploadcare(document.body, {
    locale: "en",
  });
}
