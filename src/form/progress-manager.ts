import semver from "semver";

export type StoredForms = {
  version: string;
  store: Record<string, FormProgress>;
};

export interface FormProgress {
  version?: string;
  fields: any;
  components: FormProgressComponent[];
}

export interface FormProgressComponent<T = {}> {
  id: string;
  version: string;
  data: T;
}

export class FormProgressManager {
  public static readonly storageKey: string = "formProgress";
  public readonly storageKey = FormProgressManager.storageKey;
  public readonly version: string = "1.0.0";

  public initialized: boolean = false;
  public data: StoredForms;

  private errors = {
    /** Throw when instance was not initialized. */
    init: new Error(`Manager is not initialized.`),
    invalidVersion: new Error(`Invalid semver version format`),
    invalidId: new Error(`ProgressManager: Please specify a valid id.`),
  };

  constructor(read: boolean = true) {
    if (!read) return;
    this.read();
  }

  public checkVersion(version: string = this.data.version): boolean {
    const cleanCurrent = semver.clean(this.version);
    const cleanSaved = semver.clean(version);

    if (!cleanCurrent || !cleanSaved) {
      throw this.errors.invalidVersion;
    }

    if (!semver.eq(cleanCurrent, cleanSaved)) {
      console.warn(
        `Version ${cleanSaved} is outdated compared to the current version ${cleanCurrent}. Clearing...`,
      );
      this.clear();
      return false;
    }

    return true;
  }

  public read(): FormProgressManager {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const parsed = JSON.parse(raw) as StoredForms;
      if (parsed === null || !("store" in parsed)) {
        this.clear();
      } else {
        this.data = parsed;
      }
    } catch (err) {
      console.error(`Failed to read local storage:`, err);
      return this.clear();
    }

    this.initialized = true;
    this.checkVersion();
    return this;
  }

  public getForm<F extends FormProgress = FormProgress>(id: string): F | undefined {
    this.throwInitialized();
    return this.data.store[id] as F;
  }

  public saveForm(id: string, form: FormProgress): FormProgressManager {
    this.throwInitialized();
    this.data.store[id] = form;
    return this.save();
  }

  public clearForm(id: string): FormProgressManager {
    this.throwInitialized();
    this.data.store[id] = {
      version: this.data.store[id].version,
      fields: {},
      components: [],
    };

    return this.save();
  }

  public deleteForm(id: string): FormProgressManager {
    delete this.data.store[id];
    return this.save();
  }

  public initForm(id: string, version: string): FormProgressManager {
    this.throwInitialized();
    if (!id) throw this.errors.invalidId;

    const form = this.hasForm(id) ? this.getForm(id) : undefined;

    if (semver.valid(version) && semver.valid(form?.version) && semver.eq(version, form.version)) {
      return this;
    }

    this.data.store[id] = {
      version,
      fields: {},
      components: [],
    };

    return this.save();
  }

  public hasForm(id: string): boolean {
    return id in this.data.store;
  }

  public save(data: StoredForms = this.data): FormProgressManager {
    this.checkVersion(data.version);

    const dataWithVersion: StoredForms = {
      version: this.version,
      store: data.store,
    };

    localStorage.setItem(this.storageKey, JSON.stringify(dataWithVersion));

    this.data = dataWithVersion;
    return this;
  }

  private throwInitialized(): void {
    if (!this.initialized) throw this.errors.init;
  }

  public clear(): FormProgressManager {
    this.data = {
      version: this.version,
      store: {},
    };

    return this.save();
  }

  public remove(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export default FormProgressManager;
