import createAttribute from "../attributeselector/index.js";
import { format } from "date-fns";
import type { Locale } from "date-fns";

type ElementsArg = Array<NodeListOf<HTMLElement> | HTMLElement | string>;
type AttrObject = {
  [key: string]: string;
};

function getDomElements(...elements: ElementsArg): HTMLElement[] {
  const containers: HTMLElement[] = [];

  elements.forEach((entry) => {
    if (entry instanceof HTMLElement) {
      containers.push(entry);
    } else if (typeof entry === "string") {
      containers.push(...Array.from(document.querySelectorAll<HTMLElement>(entry)));
    } else if (entry instanceof NodeList) {
      containers.push(...Array.from(entry));
    } else if (entry === null) {
      return;
    } else {
      throw new Error(`Passed container entry was not of type "string" or "HTMLElement".`);
    }
  });
  return containers;
}

const attr: AttrObject = {
  date: "dateflow-date",
  time: "dateflow-time",
  format: "dateflow-format",
};

export function parseDateflow(element: HTMLElement): Date {
  const dateString: string | null = element.getAttribute(attr.date);
  if (!dateString) {
    throw new Error(`Date string is empty.`);
  } else if (dateString === "today") {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }
  const time: number = parseFloat(element.getAttribute(attr.time) || "0.00");
  const [year, month, day] = dateString.split("-").map(Number);
  const hour = Math.floor(time);
  const minute = Math.round(time * 100) % 10 ** 2;
  const date = new Date(year, month - 1, day, hour, minute);
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`Invalid date string "${dateString}" or invalid time string "${time}".`);
  }
  return date;
}

/**
 * Formats all elements marked with the `[dateflow-date]` attribute.
 *
 * The value of `[dateflow-date]` should be an ISO-like string (e.g. `"yyyy-MM-dd"`).
 * The output format is determined by the element’s `[dateflow-format]` attribute,
 * which uses the same tokens as `date-fns` (e.g. `"dd.MM.yyyy"`, `"MMMM do, yyyy"`).
 *
 * @param locale - A `date-fns` `Locale` object that controls language-specific formatting.
 * @param containers - One or more root elements within which `[dateflow-date]` elements
 *                     will be searched and formatted. Defaults to the whole document
 *                     if no containers are provided.
 *
 * @example
 * ```html
 * <div dateflow-date="2025-08-23" dateflow-format="dd.MM.yyyy"></div>
 * ```
 */
export function dateflow(locale: Locale, ...containers: ElementsArg): void {
  const containerList: HTMLElement[] = getDomElements(...containers);
  const dateSelector = createAttribute(attr.date);
  const dateQuery: string = `${dateSelector()}:not(.w-condition-invisible, .w-condition-invisible [${attr.date}])`;
  let i: number = 0;

  containerList.forEach((c) => {
    const dateElements = c.querySelectorAll<HTMLElement>(dateQuery);
    dateElements.forEach((element) => {
      i++;
      let date: Date;

      try {
        date = parseDateflow(element);
      } catch (error) {
        if (error instanceof Error) {
          console.warn(`Failed to parse date #${i}. ${error.message} Skipping date.`);
        } else {
          console.warn(
            `Failed to parse date #${i}. Unknown error: ${String(error)} Skipping date.`,
          );
        }
        return;
      }

      const formatString: string | null = element.getAttribute(attr.format);
      // debug here
      if (!formatString) {
        console.warn(
          `Format string #${i} is empty. Perhaps you missed the "dateflow-format" attribute?`,
        );
        return;
      }
      element.innerText = format(date, formatString, { locale: locale });
    });
  });
}
