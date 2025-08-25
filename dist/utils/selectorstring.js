export default function getSelectorStringForError(element) {
    return `${element.tagName}${element.id ? "#" + element.id : ""}${element.className ? "." + element.className.replace(" ", ".") : ""}`;
}
