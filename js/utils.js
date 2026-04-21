export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined) return fallback;

  const normalized = String(value).replace(",", ".");
  const num = Number(normalized);

  return Number.isFinite(num) ? num : fallback;
}
