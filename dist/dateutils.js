export function formatDate(date, options) {
    return new Date(date).toLocaleDateString('de-CH', options);
}
export function addDays(date = new Date(), days) {
    date.setDate(date.getDate() + days);
    date.setHours(0, 0, 0, 0);
    return date;
}
export function getMonday(date = new Date(), week = 0) {
    let dayOfWeek = date.getDay();
    let daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
    date.setDate(date.getDate() - daysToMonday);
    date.setDate(date.getDate() + week * 7);
    date.setHours(0, 0, 0, 0);
    return date;
}
