import { Modal } from "./modal.js";
export class AlertDialog extends Modal {
    confirm(message) {
        this.message = message;
        this.open();
        return new Promise((resolve) => {
            const confirmBtn = this.select("confirm");
            const cancelBtn = this.select("cancel");
            const onConfirm = () => {
                cleanup();
                this.close();
                resolve(true);
            };
            const onCancel = () => {
                cleanup();
                this.close();
                resolve(false);
            };
            const cleanup = () => {
                confirmBtn.removeEventListener("click", onConfirm);
                cancelBtn.removeEventListener("click", onCancel);
            };
            confirmBtn.addEventListener("click", onConfirm);
            cancelBtn.addEventListener("click", onCancel);
        });
    }
    set message(message) {
        this._message = message;
        this.renderMessage(message);
    }
    get message() {
        return this._message;
    }
    renderMessage(message) {
        for (const key in message) {
            const element = this.getElement(key);
            if (element) {
                element.innerText = message[key];
            }
            else {
                console.warn(`AlertDialog: Missing element for key "${key}"`);
            }
        }
    }
    getElement(element) {
        return this.component.querySelector(`[data-alert-dialog="${element}"]`);
    }
}
