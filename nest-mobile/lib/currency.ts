/**
 * Formatos monetarios en MXN. Centralizado acá para mantener consistencia
 * (símbolo, separadores de miles, decimales) cuando el BE empiece a
 * mandar precios reales.
 */

const MXN = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const MXN_DECIMALS = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMXN(value: number, opts?: { decimals?: boolean }): string {
  if (!Number.isFinite(value)) return '$0';
  return opts?.decimals ? MXN_DECIMALS.format(value) : MXN.format(value);
}

export function formatPriceDelta(delta: number): string {
  if (delta === 0) return 'Incluido';
  const sign = delta > 0 ? '+' : '−';
  return `${sign}${formatMXN(Math.abs(delta))}`;
}
