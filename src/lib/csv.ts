import { parseDatabaseDate } from "@/lib/database-date";
export const CSV_BOM="\uFEFF";
export function cellText(value: unknown): string {
  if(value==null) return "";
  if(value instanceof Date) return value.toISOString();
  if(Array.isArray(value)) return value.map(v=>typeof v==="object"?JSON.stringify(v):String(v)).join("; ");
  if(typeof value==="object") return JSON.stringify(value);
  if(typeof value==="string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return parseDatabaseDate(value)?.toISOString()??value;
  return String(value);
}
export function csvCell(value: unknown): string {let text=cellText(value);if(/^[=+\-@\t\r]/.test(text)) text=`'${text}`;return /[",\r\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;}
export function csvRow(values: unknown[]): string {return values.map(csvCell).join(",")+"\r\n";}
