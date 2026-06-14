/**
 * Environment Configuration
 * Handles dynamic URLs and environment detection across Production, Staging, and Develop
 */

/**
 * Get the application URL based on the current environment
 * - Production (main branch): hiretivo.com
 * - Staging branch: Vercel auto-generated URL or custom domain
 * - Develop branch: Vercel auto-generated URL or custom domain
 * - Local: localhost:3000
 */
export function getAppUrl(): string {
  // Explicit production URL
  if (process.env.VERCEL_ENV === "production") {
    return process.env.NEXT_PUBLIC_APP_URL ?? "https://hiretivo.com";
  }

  // Check if we're on a specific branch (staging or develop)
  const branch = process.env.VERCEL_GIT_COMMIT_REF;

  // Staging branch
  if (branch === "staging") {
    return (
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
    );
  }

  // Develop branch
  if (branch === "develop") {
    return (
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
    );
  }

  // All other previews and local development
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

/**
 * Current application URL
 * Use this throughout the app for OAuth redirects, email links, etc.
 */
export const APP_URL = getAppUrl();

/**
 * Environment detection helpers
 */
export const IS_PRODUCTION = process.env.VERCEL_ENV === "production";
export const IS_PREVIEW = process.env.VERCEL_ENV === "preview";
export const IS_DEVELOPMENT = process.env.VERCEL_ENV === "development";

/**
 * Branch detection helpers
 */
export const IS_STAGING = process.env.VERCEL_GIT_COMMIT_REF === "staging";
export const IS_DEVELOP = process.env.VERCEL_GIT_COMMIT_REF === "develop";
export const IS_MAIN = process.env.VERCEL_GIT_COMMIT_REF === "main";

/**
 * Current branch name (useful for debugging)
 */
export const CURRENT_BRANCH = process.env.VERCEL_GIT_COMMIT_REF ?? "local";

/**
 * Environment display name
 */
export function getEnvironmentName(): string {
  if (IS_PRODUCTION) return "Production";
  if (IS_STAGING) return "Staging";
  if (IS_DEVELOP) return "Development";
  if (IS_PREVIEW) return "Preview";
  return "Local";
}

/**
 * support url
 */

export const SUPPORT_URL = "/contact";

/**
 * Check if we're in a server environment
 */
export const IS_SERVER = typeof window === "undefined";

/**
 * Site metadata
 */
export const SITE_NAME = "Hiretivo";
export const SITE_DESCRIPTION =
  "Hire verified Indian engineers for your startup. Pre-vetted talent with real skills, salary transparency, and availability.";

/**
 * Get OAuth redirect URL for a provider
 * Example: getOAuthCallbackUrl('google') → 'https://hiretivo.com/api/auth/callback/google'
 */
export function getOAuthCallbackUrl(provider: string): string {
  return `${APP_URL}/api/auth/callback/${provider}`;
}

/**
 * Get absolute URL for a path
 * Example: getAbsoluteUrl('/jobs/123') → 'https://hiretivo.com/jobs/123'
 */
export function getAbsoluteUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${APP_URL}${normalizedPath}`;
}

/**
 * Database configuration
 * The DATABASE_URL is automatically set by Vercel based on branch
 */
export const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Feature flags based on environment
 */
export const FEATURES = {
  // Enable debug mode in non-production environments
  DEBUG_MODE: !IS_PRODUCTION,

  // Enable analytics only in production
  ANALYTICS: IS_PRODUCTION,

  // Rate limiting (stricter in production)
  RATE_LIMIT_ENABLED: IS_PRODUCTION || IS_STAGING,

  // Email sending (only production and staging)
  EMAIL_ENABLED: IS_PRODUCTION || IS_STAGING,

  // Show environment badge in non-production
  SHOW_ENV_BADGE: !IS_PRODUCTION,
} as const;
