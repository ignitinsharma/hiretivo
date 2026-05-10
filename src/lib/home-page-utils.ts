/*
 * formatEnumLabel
 * Converts enum-style values into user-facing title labels.
 * @param value - Optional enum value from a job record
 * @returns Formatted label or null when no value is present
 */
export function formatEnumLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

/*
 * formatSalaryRange
 * Formats optional salary bounds and currency into homepage job-card copy.
 * @param min - Optional lower salary bound
 * @param max - Optional upper salary bound
 * @param currency - Optional ISO currency code
 * @returns User-facing salary range copy
 */
export function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string | null,
): string {
  if (!min && !max) return "Competitive";

  const symbol =
    currency === "GBP"
      ? "£"
      : currency === "EUR"
        ? "€"
        : currency === "INR"
          ? "₹"
          : "$";
  const formatAmount = (amount: number): string =>
    `${symbol}${Math.round(amount / 1000)}k`;

  if (min && max) return `${formatAmount(min)} – ${formatAmount(max)}`;
  if (min) return `From ${formatAmount(min)}`;
  return max ? `Up to ${formatAmount(max)}` : "Competitive";
}