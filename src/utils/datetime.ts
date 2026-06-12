/** Format a slot ISO timestamp for list/detail rows (e.g. "Thu 28 Nov · 18:00"). */
export function formatSlotDateTime(iso: string, language: string): string {
  const locale = language.startsWith("es") ? "es-MX" : "en-US";
  const date = new Date(iso);
  const datePart = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
  const timePart = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${datePart} · ${timePart}`;
}
