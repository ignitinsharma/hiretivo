import * as Sentry from "@sentry/nextjs";

/*
 * Sentry edge (Vercel Edge / middleware) initialization.
 * Loaded via instrumentation.ts register() when NEXT_RUNTIME === "edge".
 * Safe no-op when SENTRY_DSN is unset.
 */

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
  });
}
