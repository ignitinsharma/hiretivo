/*
 * escapeHtml
 * Escapes HTML-significant characters so untrusted, user-controlled strings
 * (seeker names, job titles, free-text fields) can be safely interpolated
 * into email HTML templates without allowing markup/script injection.
 * @param value - Raw string to escape
 * @returns HTML-safe string
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/*
 * safeHttpUrl
 * Returns the URL only if it is an http(s) URL, else null. Prevents
 * javascript:/data: scheme injection into email href attributes.
 * @param value - Candidate URL (may be null/undefined)
 * @returns The URL if safe, otherwise null
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return null;
}
