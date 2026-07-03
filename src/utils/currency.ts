export function formatMxn(amount: number): string {
  return `$${Math.round(amount).toLocaleString("es-MX")}`;
}
