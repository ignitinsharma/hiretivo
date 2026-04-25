import { CurrencyCode } from "@/constants/enums";

/**
 * Parse salary text input into structured numeric fields.
 * Input examples: "$120k - $150k", "$80,000 - $100,000", "100k", "", "negotiable"
 * Output: { salaryMin, salaryMax, currency } — nulls if not parseable
 */
export function parseSalaryText(text: string): {
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
} {
  if (!text || !text.trim()) {
    return { salaryMin: null, salaryMax: null, currency: CurrencyCode.USD };
  }

  const currency = text.includes("£")
    ? CurrencyCode.GBP
    : text.includes("€")
      ? CurrencyCode.EUR
      : CurrencyCode.USD;

  // Match numbers (with optional k/K suffix and optional commas)
  const matches = Array.from(text.matchAll(/[\d,]+\s*[kK]?/g))
    .map((m) => {
      const raw = m[0].replace(/,/g, "").trim();
      const num = parseFloat(raw);
      // Multiply by 1000 if 'k' suffix present in original match context
      const isK = /[kK]/.test(
        text.slice(m.index ?? 0, (m.index ?? 0) + m[0].length + 1),
      );
      return isK ? Math.round(num * 1000) : Math.round(num);
    })
    .filter((n) => !isNaN(n) && n > 0);

  if (matches.length === 0)
    return { salaryMin: null, salaryMax: null, currency };
  if (matches.length === 1)
    return { salaryMin: matches[0], salaryMax: null, currency };
  return { salaryMin: matches[0], salaryMax: matches[1], currency };
}
