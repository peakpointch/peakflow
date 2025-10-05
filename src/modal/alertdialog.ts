import { Modal } from "./modal.js";

export interface AlertDialogMessage {
  title: string;
  paragraph: string;
  confirm: string;
  cancel: string;
}

type AlertDialogMessageElement = keyof AlertDialogMessage;

export class AlertDialog extends Modal {
  private _message: AlertDialogMessage;

  public confirm(message?: AlertDialogMessage): Promise<boolean> {
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

  public set message(message: AlertDialogMessage) {
    this._message = message;
    this.renderMessage(message);
  }

  public get message() {
    return this._message;
  }

  private renderMessage(message: AlertDialogMessage): void {
    for (const key in message) {
      const element = this.getElement(key as AlertDialogMessageElement);
      if (element) {
        element.innerText = message[key as AlertDialogMessageElement];
      } else {
        console.warn(`AlertDialog: Missing element for key "${key}"`);
      }
    }
  }

  private getElement(element: AlertDialogMessageElement): HTMLElement {
    return this.component.querySelector<HTMLElement>(`[data-alert-dialog="${element}"]`);
  }
}
