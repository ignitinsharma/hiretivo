import DOMPurify from 'dompurify';

/*
 * Allowed tags include `mark` and `span` so the AI summary's skill-highlight
 * markup ('<mark class="...">') renders. Class attribute is allowed so the
 * existing summary CSS selectors (e.g. .summary-container, .summary-skills)
 * keep working post-sanitize. Classes are inert (no script execution) so
 * widening ATTR here does not increase XSS surface; URL-bearing attrs
 * (href etc.) remain the only injection vectors and DOMPurify still strips
 * javascript: URIs by default.
 */
const ALLOWED_TAGS = ['p', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'br', 'a', 'span', 'mark', 'div'];
const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'],
  });
}

export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
