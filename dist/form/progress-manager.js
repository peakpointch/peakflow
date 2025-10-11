import semver from "semver";
export class FormProgressManager {
    constructor(read = true) {
        this.storageKey = FormProgressManager.storageKey;
        this.version = "1.0.0";
        this.initialized = false;
        this.errors = {
            /** Throw when instance was not initialized. */
            init: new Error(`Manager is not initialized.`),
            invalidVersion: new Error(`Invalid semver version format`),
            invalidId: new Error(`ProgressManager: Please specify a valid id.`),
        };
        if (!read)
            return;
        this.read();
    }
    checkVersion(version = this.data.version) {
        const cleanCurrent = semver.clean(this.version);
        const cleanSaved = semver.clean(version);
        if (!cleanCurrent || !cleanSaved) {
            throw this.errors.invalidVersion;
        }
        if (!semver.eq(cleanCurrent, cleanSaved)) {
            console.warn(`Version ${cleanSaved} is outdated compared to the current version ${cleanCurrent}. Clearing...`);
            this.clear();
            return false;
        }
        return true;
    }
    read() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            const parsed = JSON.parse(raw);
            if (parsed === null || !("store" in parsed)) {
                this.clear();
            }
            else {
                this.data = parsed;
            }
        }
        catch (err) {
            console.error(`Failed to read local storage:`, err);
            return this.clear();
        }
        this.initialized = true;
        this.checkVersion();
        return this;
    }
    getForm(id) {
        this.throwInitialized();
        return this.data.store[id];
    }
    saveForm(id, form) {
        this.throwInitialized();
        this.data.store[id] = form;
        return this.save();
    }
    clearForm(id) {
        this.throwInitialized();
        this.data.store[id] = {
            version: this.data.store[id].version,
            fields: {},
            components: [],
        };
        return this.save();
    }
    deleteForm(id) {
        delete this.data.store[id];
        return this.save();
    }
    initForm(id, version) {
        this.throwInitialized();
        if (!id)
            throw this.errors.invalidId;
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
    hasForm(id) {
        return id in this.data.store;
    }
    save(data = this.data) {
        this.checkVersion(data.version);
        const dataWithVersion = {
            version: this.version,
            store: data.store,
        };
        localStorage.setItem(this.storageKey, JSON.stringify(dataWithVersion));
        this.data = dataWithVersion;
        return this;
    }
    throwInitialized() {
        if (!this.initialized)
            throw this.errors.init;
    }
    clear() {
        this.data = {
            version: this.version,
            store: {},
        };
        return this.save();
    }
    remove() {
        localStorage.removeItem(this.storageKey);
    }
}
FormProgressManager.storageKey = "formProgress";
export default FormProgressManager;
