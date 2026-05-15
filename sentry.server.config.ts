import * as Sentry from "@sentry/nextjs";

/*
 * Sentry server (Node) initialization.
 * Loaded via instrumentation.ts register() when NEXT_RUNTIME === "nodejs".
 * Safe no-op when SENTRY_DSN is unset.
 */

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

/* Field names whose values are scrubbed before sending to Sentry. */
const SENSITIVE_KEYS = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "authorization",
  "cookie",
  "coverLetter",
  "resumeUrl",
  "resume",
  "phone",
]);

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.has(k) ? "[redacted]" : scrub(v);
    }
    return out;
  }
  return value;
}

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    sendDefaultPii: false,
    ignoreErrors: [
      "AbortError",
      "ECONNRESET",
    ],
    beforeSend(event) {
      if (process.env.NODE_ENV === "development") return null;
      if (event.request?.data) {
        event.request.data = scrub(event.request.data) as typeof event.request.data;
      }
      if (event.user?.email) event.user.email = undefined;
      if (event.user?.ip_address) event.user.ip_address = undefined;
      return event;
    },
  });
}
