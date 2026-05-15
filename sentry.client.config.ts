import * as Sentry from "@sentry/nextjs";

/*
 * Sentry client (browser) initialization.
 * Safe no-op when NEXT_PUBLIC_SENTRY_DSN is unset, so local dev and
 * unconfigured deploys don't error out.
 */

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    integrations: [
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "Network request failed",
    ],
    sendDefaultPii: false,
    beforeSend(event) {
      if (process.env.NODE_ENV === "development") return null;
      if (event.user?.email) event.user.email = undefined;
      if (event.user?.ip_address) event.user.ip_address = undefined;
      return event;
    },
  });
}
