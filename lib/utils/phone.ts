export function normalizePhone(value: string): string {
  return String(value || "").replace(/[^\d]/g, "");
}
