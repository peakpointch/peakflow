import { dateflow } from "./dateflow.js";
import { de } from "date-fns/locale";
export default function dateflowDefault() {
    dateflow(de, document.body);
}
