import createAttribute from "@library/attributeselector";
import { format, Locale } from "date-fns";

type ElementsArg = Array<NodeListOf<HTMLElement> | HTMLElement | string>;
type AttrObject = {
  [key: string]: string;
}

function getDomElements(...elements: ElementsArg): HTMLElement[] {
  const containers: HTMLElement[] = [];

  elements.forEach((entry) => {
    if (entry instanceof HTMLElement) {
      containers.push(entry)
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
}

export function parseDateflow(element: HTMLElement): Date {
  const dateString: string = element.getAttribute(attr.date);
  const time: number = parseFloat(element.getAttribute(attr.time) || "0.00");
  const [year, month, day] = dateString.split("-").map(Number);
  const hour = Math.floor(time);
  const minute = Math.round(time * 100) % 10 ** 2;
  if (!dateString) {
    throw new Error(`Date string is empty.`);
  }
  const date = new Date(year, month - 1, day, hour, minute);
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`Invalid date string "${dateString}" or invalid time string "${time}".`);
  }
  return date;
}

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
        console.warn(`Failed to parse date #${i}. ${error.message} Skipping date.`);
        return;
      }

      const formatString: string = element.getAttribute(attr.format);
      // debug here
      if (!formatString) {
        console.warn(`Format string #${i} is empty. Perhaps you missed the "dateflow-format" attribute?`);
        return;
      }
      element.innerText = format(date, formatString, { locale: locale });
    });
  });
}

