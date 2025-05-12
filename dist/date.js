function formatDate(date, format, locale = "de-CH") {
  const tokens = {
    "DDDD": date.toLocaleDateString(locale, { weekday: "long" }),
    "DDD": date.toLocaleDateString(locale, { weekday: "short" }),
    "dd": date.getDate().toLocaleString(locale, { minimumIntegerDigits: 2 }),
    "d": date.getDate().toLocaleString(locale, { minimumIntegerDigits: 1 }),
    "MMMM": date.toLocaleDateString(locale, { month: "long" }),
    "MMM": date.toLocaleDateString(locale, { month: "short" }),
    "MM": date.toLocaleDateString(locale, { month: "2-digit" }),
    "m": date.toLocaleDateString(locale, { month: "numeric" }),
    "YYYY": date.toLocaleDateString(locale, { year: "numeric" }),
    "YY": date.toLocaleDateString(locale, { year: "2-digit" })
  };
  return format.replace(/DDDD|DDD|dd|d|MMMM|MMM|MM|m|YYYY|YY/g, (match) => tokens[match]);
}
export {
  formatDate as default
};
