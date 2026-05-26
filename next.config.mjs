import { withSentryConfig } from "@sentry/nextjs";

/*
 * Content Security Policy
 * Starts permissive with 'unsafe-inline' for scripts/styles so Next.js inline runtime works.
 * Tighten in a follow-up by adopting nonce-based CSP once analytics + Sentry are stable.
 * Domains listed:
 *  - Vercel Insights/Analytics for first-party analytics
 *  - Sentry for client error reporting
 *  - Upstash for direct browser calls (rare, defensive)
 *  - R2 + Google avatar host + data: for images
 *  - Resend tracking pixels are server-side only, no entry needed
 */
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-insights.com https://*.vercel-scripts.com https://*.sentry.io https://*.googletagmanager.com https://*.google-analytics.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.r2.dev https://*.r2.cloudflarestorage.com https://lh3.googleusercontent.com https://*.gstatic.com https://*.google-analytics.com https://*.googletagmanager.com https://cdn.pixabay.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.sentry.io https://*.upstash.io https://*.vercel-insights.com https://*.google-analytics.com https://*.googletagmanager.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: CSP_DIRECTIVES },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

/*
 * Sentry build-time wrapper.
 * Uploads source maps when SENTRY_AUTH_TOKEN is set. Without it, build still
 * succeeds — Sentry runtime no-ops via the DSN guard in sentry.*.config.ts.
 */
const sentryBuildOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  tunnelRoute: "/monitoring",
  automaticVercelMonitors: false,
};

export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, sentryBuildOptions)
  : nextConfig;
