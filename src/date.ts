/**
 * Formats date based on a specific string format.
 *
 * @param format The format to return the date as, e.g. `DDDD, d. MMMM YYYY`.
 * @returns {string} The formatted date as a string.
 */
export default function formatDate(date: Date, format: string, locale: string = 'de-CH'): string {

  // Token mappings
  const tokens: { [key: string]: string } = {
    'DDDD': date.toLocaleDateString(locale, { weekday: 'long' }),
    'DDD': date.toLocaleDateString(locale, { weekday: 'short' }),
    'dd': date.getDate().toLocaleString(locale, { minimumIntegerDigits: 2 }),
    'd': date.getDate().toLocaleString(locale, { minimumIntegerDigits: 1 }),
    'MMMM': date.toLocaleDateString(locale, { month: 'long' }),
    'MMM': date.toLocaleDateString(locale, { month: 'short' }),
    'MM': date.toLocaleDateString(locale, { month: '2-digit' }),
    'm': date.toLocaleDateString(locale, { month: 'numeric' }),
    'YYYY': date.toLocaleDateString(locale, { year: 'numeric' }),
    'YY': date.toLocaleDateString(locale, { year: '2-digit' }),
  };

  // Replace tokens in the format string
  return format.replace(/DDDD|DDD|dd|d|MMMM|MMM|MM|m|YYYY|YY/g, (match) => tokens[match]);
}

