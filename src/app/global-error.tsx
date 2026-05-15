"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/*
 * GlobalError
 * Catches errors thrown in the root layout (above app/error.tsx scope).
 * Must include its own <html> and <body> because the root layout has crashed.
 * Reports to Sentry, then renders a minimal branded fallback. No stack trace
 * exposed to the user.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "#ffffff",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          <div style={{ maxWidth: "32rem", textAlign: "center" }}>
            <h1
              style={{
                fontSize: "2.25rem",
                fontWeight: 700,
                color: "#0a0a0a",
                marginBottom: "1rem",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: "1.125rem",
                color: "#6b7280",
                marginBottom: "2rem",
              }}
            >
              We hit an unexpected error. Our team has been notified. Please try
              again.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                backgroundColor: "#7560ff",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.875rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
