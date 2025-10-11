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
export declare class FormProgressManager {
    static readonly storageKey: string;
    readonly storageKey: string;
    readonly version: string;
    initialized: boolean;
    data: StoredForms;
    private errors;
    constructor(read?: boolean);
    checkVersion(version?: string): boolean;
    read(): FormProgressManager;
    getForm<F extends FormProgress = FormProgress>(id: string): F | undefined;
    saveForm(id: string, form: FormProgress): FormProgressManager;
    clearForm(id: string): FormProgressManager;
    deleteForm(id: string): FormProgressManager;
    initForm(id: string, version: string): FormProgressManager;
    hasForm(id: string): boolean;
    save(data?: StoredForms): FormProgressManager;
    private throwInitialized;
    clear(): FormProgressManager;
    remove(): void;
}
export default FormProgressManager;
