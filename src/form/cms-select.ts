import createAttribute from "../attributeselector";
import { getAllElements, getElement } from "../utils/getelements";

type CMSSelectElement = 'source' | 'target' | 'option';
interface CMSSelectAttr {
  id: string;
  element: string;
  prefix: string;
  value: string;
  status: string;
  wait: string;
}

interface CMSSelectOptions {
  id: string;
}

export default class CMSSelect {
  public opts: CMSSelectOptions = {
    id: undefined
  }
  public id: string;
  public source: HTMLElement;
  public targets: HTMLSelectElement[];
  public values: string[];
  public waitEvent: string;
  public static attr: CMSSelectAttr = {
    id: 'data-cms-select-id',
    element: 'data-cms-select-element',
    prefix: 'data-cms-select-prefix',
    value: 'data-cms-select-value',
    wait: 'data-cms-select-wait',
    status: 'data-cms-select-status',
  };
  public attr: CMSSelectAttr = CMSSelect.attr;

  constructor(component: string | HTMLElement, options: Partial<CMSSelectOptions> = {}) {
    try {
      this.source = getElement(component);

      if (!this.source) {
        throw new Error(`Source list element is not defined.`);
      }

      // Get and set id
      this.opts = { id: options.id ?? this.opts.id };
      this.id = this.opts.id || this.source.getAttribute(this.attr.id);
      this.source.setAttribute(this.attr.id, this.opts.id);

      this.waitEvent = this.source.dataset.formSelectWait || null;
      this.targets = getAllElements<HTMLSelectElement>(this.selector('target'));
      this.readValues();
    } catch (e) {
      console.error(`Failed to create CMSSelect instance: ${e.message}`);
    }
  }

  private static attributeSelector = createAttribute<CMSSelectElement>('data-cms-select-element');

  /**
   * Static selector
   */
  public static selector(element: CMSSelectElement, instance?: string): string {
    const base = CMSSelect.attributeSelector(element);
    const instanceSelector = instance
      ? `[${CMSSelect.attr.id}="${instance}"]`
      : "";

    if (element === 'option') {
      return `${instanceSelector} ${base}`.trim();
    } else {
      return `${base}${instanceSelector}`
    }
  }

  /**
   * Instance selector
   */
  public selector(element: CMSSelectElement, local = true): string {
    return local
      ? CMSSelect.selector(element, this.id)
      : CMSSelect.selector(element);
  }

  public static initializeAll(): void {
    try {
      const sourceLists = getAllElements(CMSSelect.selector('source'));
      sourceLists.forEach(list => {
        const cmsSelect = new CMSSelect(list);
        if (cmsSelect.initWaitEvent(true)) return;
        cmsSelect.insertSelectOptions();
      });
    } catch (e) {
      console.error(`Failed to initialize all CMS select components: ${e.message}`);
    }
  }

  public static createOption(value: string): HTMLOptionElement {
    const optionElement = document.createElement('option');
    optionElement.setAttribute('value', value);
    optionElement.innerText = value;

    return optionElement;
  }

  /**
   * @param graceful Whether to throw an error if the wait event is invalid.
   * @returns A boolean indicating whether the wait event was initialized successfully.
   */
  public initWaitEvent(graceful: boolean = false): boolean {
    if (this.waitEvent) {
      this.source.addEventListener(this.waitEvent, () => {
        this.insertSelectOptions()
      });
      return true;
    } else {
      const message = `The wait event name "${this.waitEvent}" is invalid.`;
      if (graceful) return false;
      throw new Error(message);
    }
  }

  public readValues(): void {
    this.values = [];
    const optionElements = this.source.querySelectorAll<HTMLElement>(CMSSelect.selector('option'));
    optionElements.forEach(element => {
      this.values.push(this.getSelectValue(element));
    });
  }

  private insertSelectOptions(targets: HTMLSelectElement[] = this.targets) {
    this.values.forEach(val => {
      if (val) {
        const option = CMSSelect.createOption(val);
        targets.forEach(target => target.appendChild(option));
      } else {
        console.warn('CMS select: skip empty option');
      }
    });
  }

  public getSelectValue(item: HTMLElement) {
    const prefix = item.getAttribute(this.attr.prefix) || "";
    const value = item.getAttribute(this.attr.value) || "";

    const optionValue = prefix ? `${prefix} ${value}` : value;
    return optionValue;
  }
}
