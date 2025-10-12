export function pluralize(text, count) {
    if (count === 1) {
        return text.sg;
    }
    else {
        return text.pl;
    }
}
