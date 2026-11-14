/**
 * The strings that bind encrypted, signed and stored data to Hiretivo: the
 * HKDF info that derives every key, the associated data of each encrypted
 * secret, and the audiences of signed tokens.
 *
 * Changing any of them makes data written under the old string unreadable, so
 * they only change on a fresh install. They live here, in one place, so that
 * change is easy to audit.
 */
export const CRYPTO_CONTEXT = {
  /** HKDF info for a key derived for `purpose` from HIRETIVO_SECRET. */
  keyDerivation: (purpose: string) => `hiretivo ${purpose} v1`,
  /** Associated data of each encrypted secret (SecretKind in secrets.ts). */
  apiKey: "hiretivo api key v1",
  jobSourceKey: "hiretivo job source key v1",
  typesafeKey: "hiretivo typesafe key v1",
  googleToken: "hiretivo google token v1",
  googleClientSecret: "hiretivo google client secret v1",
  /** Signed tokens' audiences. */
  googleOAuthState: "hiretivo-google-oauth",
  connectorClient: "hiretivo-connector-client",
  connectorCode: "hiretivo-connector-code",
  connectorAccess: "hiretivo-mcp",
  connectorRefresh: "hiretivo-connector-refresh",
  print: "hiretivo-print",
  /** Request headers that carry a signed token. */
  desktopTokenHeader: "x-hiretivo-desktop-token",
  printTokenHeader: "x-hiretivo-print-token",
  /** The private Google Calendar property that ties an event to its application. */
  calendarApplication: "hiretivoApplication",
} as const;
