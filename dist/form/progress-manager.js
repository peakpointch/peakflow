import semver from "semver";
export class FormProgressManager {
    constructor(read = true) {
        this.storageKey = FormProgressManager.storageKey;
        this.version = "1.0.0";
        this.initialized = false;
        if (!read)
            return;
        this.read();
    }
    checkVersion(version = this.data.version) {
        const cleanCurrent = semver.clean(this.version);
        const cleanSaved = semver.clean(version);
        if (!cleanCurrent || !cleanSaved) {
            throw new Error(`Invalid semver version format`);
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
            if (parsed === null) {
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
            throw new Error(`Manager is not initialized.`);
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
