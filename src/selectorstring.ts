export default function getSelectorStringForError(element: HTMLElement): string | null {
  return `${element.tagName
    }${element.id
      ? '#' + element.id
      : ''
    }${element.className
      ? '.' + element.className.replace(' ', '.')
      : ''
    }`;
}
