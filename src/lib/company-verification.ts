/*
 * FREEMAIL_DOMAINS
 * Canonical lowercase list of personal email providers that cannot auto-verify company identity.
 * Keep lowercase; extend as needed.
 */
export const FREEMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "yahoo.co.in", "hotmail.com",
  "outlook.com", "live.com", "proton.me", "protonmail.com",
  "icloud.com", "me.com", "msn.com",
]);

/*
 * extractDomain
 * Returns the bare hostname from a URL string, stripping a leading www. prefix.
 * Prepends https:// when no scheme is present. Returns null on invalid input.
 * @param url - Raw website URL (e.g. "https://www.stripe.com" or "stripe.com")
 * @returns Bare domain string (e.g. "stripe.com") or null if input is invalid
 */
export function extractDomain(url: string): string | null {
  try {
    const withScheme = url.startsWith("http") ? url : `https://${url}`;
    const hostname = new URL(withScheme).hostname.toLowerCase();
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/*
 * isFreemailDomain
 * Returns true when the email's domain is a known personal email provider.
 * @param email - Full email address (e.g. "user@gmail.com")
 * @returns true if the email uses a freemail domain, false otherwise
 */
export function isFreemailDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return FREEMAIL_DOMAINS.has(domain);
}

/*
 * checkLevel1Match
 * Returns true when the email domain exactly equals the website domain (after www strip).
 * Subdomain mismatch (careers.stripe.com vs stripe.com) is intentionally NOT a match —
 * only an exact hostname comparison is safe for Level 1 auto-verification.
 * @param email - Full email address (e.g. "nitin@stripe.com")
 * @param websiteUrl - Company website URL (e.g. "https://stripe.com")
 * @returns true if email domain === website domain, false otherwise
 */
export function checkLevel1Match(email: string, websiteUrl: string): boolean {
  const emailDomain = email.split("@")[1]?.toLowerCase() ?? "";
  const websiteDomain = extractDomain(websiteUrl);
  return !!websiteDomain && emailDomain === websiteDomain;
}
