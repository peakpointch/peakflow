import Modal from "./modal";
interface AlertDialogMessage {
    title: string;
    paragraph: string;
    confirm: string;
    cancel: string;
}
export default class AlertDialog extends Modal {
    private _message;
    confirm(message?: AlertDialogMessage): Promise<boolean>;
    set message(message: AlertDialogMessage);
    get message(): AlertDialogMessage;
    private renderMessage;
    private getElement;
}
export {};
