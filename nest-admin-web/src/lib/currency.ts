/** Formatea un monto en MXN con el formato local mexicano. */
export function formatMxn(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(value);
}
