export function pluralize(text, count) {
    if (count === 1) {
        return text.singular;
    }
    else {
        return text.plural;
    }
}
