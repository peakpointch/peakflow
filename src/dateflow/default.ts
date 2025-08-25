import { dateflow } from "./dateflow";
import { de } from "date-fns/locale";

export default function dateflowDefault(): void {
  dateflow(de, document.body);
}
