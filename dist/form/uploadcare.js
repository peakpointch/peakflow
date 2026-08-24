import { logPrefix } from "../utils/logger.js";
import Stylesheet from "../utils/stylesheet.js";
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
};
const UCAttr = {
    id: "data-uploadcare-id",
    element: "data-uploadcare-element",
    field: "data-uploadcare-field",
    pubkey: "data-uploadcare-pubkey",
    sourceList: "data-uploadcare-source-list",
    cameraModes: "data-uploadcare-camera-modes",
};
const UCSelector = {
    id: `[${UCAttr.id}]`,
    fields: {
        url: `[${UCAttr.field}="url"]`,
        uuid: `[${UCAttr.field}="uuid"]`,
    },
    elements: {
        component: `[${UCAttr.element}="component"]`,
        target: `[${UCAttr.element}="target"]`,
    },
};
function getUploaderClass(theme, className, componentName) {
    const baseClass = `${className} ${componentName}`.trim();
    switch (theme) {
        case "light":
            return `${baseClass} uc-light`;
        case "dark":
            return `${baseClass} uc-dark`;
        case "auto":
        default:
            return baseClass;
    }
}
function getTarget(cfg, prefix) {
    let target = cfg.target;
    if (target)
        return target;
    const idSuffix = cfg.name ? `[${UCAttr.id}="${cfg.name}"]` : "";
    const globalTargetSelector = `${UCSelector.elements.target}${idSuffix}`;
    target = cfg.component.querySelector(UCSelector.elements.target);
    if (target)
        return target;
    if (idSuffix) {
        target = document.body.querySelector(globalTargetSelector);
        if (target)
            return target;
    }
    throw new Error(`${prefix}Target element not found. Please specify a target element or tag it correctly with "${UCSelector.elements.target}" or with "${globalTargetSelector}" if the target element is not a descendant of the component element.`);
}
function initUCConfig(config) {
    const prefix = logPrefix("Uploadcare", config.name);
    const defaultFields = Object.fromEntries(Object.entries(UCSelector.fields).map(([key, selector]) => {
        const el = config.component.querySelector(selector);
        if (!el) {
            throw new Error(`${prefix}Default field with selector "${selector}" not found.`);
        }
        return [key, el];
    }));
    const cfg = {
        name: config.name,
        component: config.component ?? document.body,
        locale: config.locale ?? "en",
        fields: {
            ...defaultFields,
            ...config.fields,
        },
        theme: config.theme ?? "auto",
        className: config.className ?? "my-config",
        pubkey: config.pubkey,
        target: config.target,
        replaceTarget: config.replaceTarget ?? false,
        sourceList: config.sourceList.length
            ? config.sourceList
            : ["local", "camera", "dropbox", "gdrive"],
        cameraModes: config.cameraModes.length ? config.cameraModes : ["photo", "video"],
    };
    cfg.target = getTarget(cfg, prefix);
    if (!cfg.component) {
        throw new Error(`${prefix}Component element for file uploader not found.`);
    }
    if (!cfg.pubkey) {
        throw new Error(`${prefix}Public api key is missing.`);
    }
    return cfg;
}
function initUCEvents(ctxProvider, prefix, cfg) {
    ctxProvider.addEventListener("change", (event) => {
        const UCEvent = event;
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
        }
        else {
            urlField.value = cdnUrlArray.join(", ");
            urlField.dispatchEvent(new Event("change", { bubbles: true }));
        }
    });
}
/**
 * Injects Uploadcare File Uploader web components (config, uploader, ctx-provider)
 * and ensures the stylesheet is loaded once.
 *
 * @returns References to the created elements, esp. ctxProvider.
 */
export function mountUCFileUploader(config) {
    // 1. Ensure stylesheet is present
    new Stylesheet({
        href: "https://cdn.jsdelivr.net/npm/@uploadcare/file-uploader@v1/web/uc-file-uploader-minimal.min.css",
    }).load();
    // 2. Create <uc-config>
    const configEl = document.createElement("uc-config");
    configEl.setAttribute("locale-name", config.locale);
    configEl.setAttribute("ctx-name", config.name);
    configEl.setAttribute("pubkey", config.pubkey);
    configEl.setAttribute("group-output", "");
    configEl.setAttribute("source-list", config.sourceList.join(", "));
    if (config.sourceList.includes("camera")) {
        configEl.setAttribute("camera-modes", config.cameraModes.join(", "));
    }
    // 3. Create <uc-file-uploader-minimal>
    const uploaderEl = document.createElement("uc-file-uploader-minimal");
    uploaderEl.setAttribute("ctx-name", config.name);
    uploaderEl.className = getUploaderClass(config.theme, config.className, config.name);
    // 4. Create <uc-upload-ctx-provider>
    const ctxProvider = document.createElement("uc-upload-ctx-provider");
    ctxProvider.setAttribute("ctx-name", config.name);
    // Insert them into DOM (order matters: config + uploader + provider)
    if (config.replaceTarget) {
        config.target.replaceWith(configEl, uploaderEl, ctxProvider);
    }
    else {
        config.target.appendChild(configEl);
        config.target.appendChild(uploaderEl);
        config.target.appendChild(ctxProvider);
    }
    return { configEl, uploaderEl, ctxProvider };
}
/**
 * Initialize Uploadcare file-uploader instance and attach the files to a form field.
 */
export function initUCFileUploader(config) {
    const cfg = initUCConfig(config);
    const prefix = logPrefix("Uploadcare", cfg.name);
    UC.defineLocale(cfg.locale, UCLocaleMap[cfg.locale]);
    UC.defineComponents(UC);
    const { ctxProvider } = mountUCFileUploader(cfg);
    initUCEvents(ctxProvider, prefix, cfg);
}
function parseStringList(stringList) {
    if (!stringList)
        return [];
    const items = stringList
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return Array.from(new Set(items));
}
export function initUploadcare(container, config) {
    const prefix = logPrefix("Uploadcare");
    const components = container.querySelectorAll(UCSelector.id);
    if (!components.length) {
        console.warn(`${prefix}No component elements found inside container. Tag components with the "${UCSelector.id}" attribute.`);
    }
    components.forEach((component) => {
        const newConfig = {
            ...config,
            name: component.getAttribute(UCAttr.id) ?? undefined,
            component: component,
            pubkey: component.getAttribute(UCAttr.pubkey),
            sourceList: parseStringList(component.getAttribute(UCAttr.sourceList)),
            cameraModes: parseStringList(component.getAttribute(UCAttr.cameraModes)),
        };
        initUCFileUploader(newConfig);
    });
}
export function initUploadcareDefault() {
    return initUploadcare(document.body, {
        locale: "de",
    });
}
