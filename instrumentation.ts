import * as Sentry from "@sentry/nextjs";

/*
 * Next.js instrumentation entry point.
 * Routes to server vs edge Sentry init based on runtime.
 * `onRequestError` hooks into the App Router error boundary so unhandled
 * server errors flow into Sentry automatically.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
