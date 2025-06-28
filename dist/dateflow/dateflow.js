import createAttribute from "../attributeselector/index.js";
import { format } from "date-fns";
function getDomElements(...elements) {
    const containers = [];
    elements.forEach((entry) => {
        if (entry instanceof HTMLElement) {
            containers.push(entry);
        }
        else if (typeof entry === "string") {
            containers.push(...Array.from(document.querySelectorAll(entry)));
        }
        else if (entry instanceof NodeList) {
            containers.push(...Array.from(entry));
        }
        else if (entry === null) {
            return;
        }
        else {
            throw new Error(`Passed container entry was not of type "string" or "HTMLElement".`);
        }
    });
    return containers;
}
const attr = {
    date: "dateflow-date",
    time: "dateflow-time",
    format: "dateflow-format",
};
export function parseDateflow(element) {
    const dateString = element.getAttribute(attr.date);
    if (!dateString) {
        throw new Error(`Date string is empty.`);
    }
    else if (dateString === 'today') {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return now;
    }
    const time = parseFloat(element.getAttribute(attr.time) || "0.00");
    const [year, month, day] = dateString.split("-").map(Number);
    const hour = Math.floor(time);
    const minute = Math.round(time * 100) % 10 ** 2;
    const date = new Date(year, month - 1, day, hour, minute);
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        throw new Error(`Invalid date string "${dateString}" or invalid time string "${time}".`);
    }
    return date;
}
export function dateflow(locale, ...containers) {
    const containerList = getDomElements(...containers);
    const dateSelector = createAttribute(attr.date);
    const dateQuery = `${dateSelector()}:not(.w-condition-invisible, .w-condition-invisible [${attr.date}])`;
    let i = 0;
    containerList.forEach((c) => {
        const dateElements = c.querySelectorAll(dateQuery);
        dateElements.forEach((element) => {
            i++;
            let date;
            try {
                date = parseDateflow(element);
            }
            catch (error) {
                if (error instanceof Error) {
                    console.warn(`Failed to parse date #${i}. ${error.message} Skipping date.`);
                }
                else {
                    console.warn(`Failed to parse date #${i}. Unknown error: ${String(error)} Skipping date.`);
                }
                return;
            }
            const formatString = element.getAttribute(attr.format);
            // debug here
            if (!formatString) {
                console.warn(`Format string #${i} is empty. Perhaps you missed the "dateflow-format" attribute?`);
                return;
            }
            element.innerText = format(date, formatString, { locale: locale });
        });
    });
}
