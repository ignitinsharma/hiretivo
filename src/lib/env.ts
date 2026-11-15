import "server-only";

import path from "node:path";
import { isLocalDevelopmentOrigin } from "@/lib/auth/hosted/origin";

import { z } from "zod";

const SECRET_MIN_LENGTH = 32;
const GENERATE_SECRET = "for example the output of `openssl rand -base64 32`";

export const AI_PROVIDERS = ["local", "openai", "anthropic", "mistral", "gemini", "groq", "openrouter", "lmstudio"] as const;
export const JOB_SOURCE_NAMES = ["jsearch", "adzuna", "arbeitsagentur", "freehire", "off"] as const;
export const SCORER_NAMES = ["ai", "jev"] as const;

// An empty value (`HIRETIVO_AI_KEY=` in .env) counts as unset.
const unsetIfEmpty = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const required = (name: string, fix: string) =>
  z.preprocess(
    unsetIfEmpty,
    z.string({ error: `${name} is not set. ${fix}` }),
  );

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(unsetIfEmpty, schema.optional());

const schema = z.object({
  // Never echo the value: it may be the sign-in password itself.
  HIRETIVO_DEPLOYMENT_MODE: z.enum(["self-hosted", "hosted"]).optional(),
  HIRETIVO_PASSWORD: z.preprocess(unsetIfEmpty, z.string().trim().default("")),
  RESEND_API_KEY: optional(z.string()),
  RESEND_FROM_EMAIL: optional(z.string()),
  HIRETIVO_SECRET: required(
    "HIRETIVO_SECRET",
    `Set it to a random string of at least ${SECRET_MIN_LENGTH} characters, ${GENERATE_SECRET}.`,
  ).pipe(
    z.string().min(SECRET_MIN_LENGTH, {
      error: (issue) =>
        `HIRETIVO_SECRET is too short (${String(issue.input).length} characters). Use at least ${SECRET_MIN_LENGTH} random characters, ${GENERATE_SECRET}.`,
    }),
  ),
  DATABASE_URL: required(
    "DATABASE_URL",
    "Set it to your PostgreSQL connection string, e.g. postgresql://user:password@host:5432/hiretivo, or to an SQLite file, e.g. file:/data/hiretivo.db.",
  ).pipe(
    // Never echo the value: it contains the database password.
    z
      .string()
      .regex(/^(postgres(ql)?:\/\/|file:)/, {
        error:
          "DATABASE_URL must be a PostgreSQL connection string starting with postgresql://, or an SQLite file starting with file:.",
      })
      // A relative path would mean another file to the migrations, which run in another folder.
      .refine((url) => !url.startsWith("file:") || path.isAbsolute(url.slice("file:".length)), {
        error: "DATABASE_URL must give the SQLite file's full path, e.g. file:/data/hiretivo.db.",
      }),
  ),
  HIRETIVO_DATA_DIR: z
    .preprocess(unsetIfEmpty, z.string().default("/data"))
    .transform((dir) => path.resolve(dir)),
  HIRETIVO_BACKUP_RETENTION_DAYS: z
    .preprocess(unsetIfEmpty, z.string().trim().default("14"))
    .pipe(
      z.string().regex(/^\d+$/, {
        error: (issue) =>
          `HIRETIVO_BACKUP_RETENTION_DAYS must be a whole number of days (got "${String(issue.input)}").`,
      }),
    )
    .transform(Number)
    .pipe(
      z.number().min(1, {
        error: "HIRETIVO_BACKUP_RETENTION_DAYS must be at least 1.",
      }),
    ),
  HIRETIVO_AI_PROVIDER: optional(
    z.enum(AI_PROVIDERS, {
      error: (issue) =>
        `HIRETIVO_AI_PROVIDER must be one of ${AI_PROVIDERS.join(", ")} (got "${String(issue.input)}").`,
    }),
  ),
  HIRETIVO_AI_URL: optional(
    z.url({
      protocol: /^https?$/,
      error: "HIRETIVO_AI_URL must be an http:// or https:// URL.",
    }),
  ),
  HIRETIVO_AI_MODEL: optional(z.string()),
  // Never echo the value: it's an API key.
  HIRETIVO_AI_KEY: optional(z.string()),
  HIRETIVO_AI_TIMEOUT_SECONDS: optional(
    z
      .string()
      .trim()
      .regex(/^\d+$/, {
        error: (issue) =>
          `HIRETIVO_AI_TIMEOUT_SECONDS must be a whole number of seconds (got "${String(issue.input)}").`,
      })
      .transform(Number)
      .pipe(z.number().min(5, { error: "HIRETIVO_AI_TIMEOUT_SECONDS must be at least 5." })),
  ),
  // Defaults for Settings → Job search (E14-4), until a choice is saved there.
  HIRETIVO_JOBS_SOURCE: optional(
    z.enum(JOB_SOURCE_NAMES, {
      error: (issue) => `HIRETIVO_JOBS_SOURCE must be one of ${JOB_SOURCE_NAMES.join(", ")} (got "${String(issue.input)}").`,
    }),
  ),
  // Never echo the values: they're API keys.
  HIRETIVO_JSEARCH_KEY: optional(z.string()),
  HIRETIVO_JSEARCH_HOST: optional(
    z.enum(["openwebninja", "rapidapi"], {
      error: (issue) => `HIRETIVO_JSEARCH_HOST must be openwebninja or rapidapi (got "${String(issue.input)}").`,
    }),
  ),
  HIRETIVO_ADZUNA_APP_ID: optional(z.string()),
  HIRETIVO_ADZUNA_KEY: optional(z.string()),
  // FreeHire origin; unset uses https://freehire.me. Point at a self-hosted
  // FreeHire, or leave unset for the public catalogue.
  HIRETIVO_FREEHIRE_URL: optional(
    z.url({ protocol: /^https?$/, error: "HIRETIVO_FREEHIRE_URL must be an http:// or https:// URL." }).transform((url) => url.replace(/\/+$/, "")),
  ),
  // Off takes the Bundesagentur für Arbeit out everywhere (#223): it isn't an
  // official API, so a server can choose not to offer it. Unset means on.
  HIRETIVO_JOBS_ARBEITSAGENTUR: optional(
    z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.enum(["on", "off"], { error: (issue) => `HIRETIVO_JOBS_ARBEITSAGENTUR must be on or off (got "${String(issue.input)}").` })),
  ),
  // Defaults for Settings → Scoring (#274), until a choice is saved there:
  // ai scores postings with the AI provider, jev with TypeSafe's Jev.
  HIRETIVO_SCORER: optional(
    z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.enum(SCORER_NAMES, { error: (issue) => `HIRETIVO_SCORER must be one of ${SCORER_NAMES.join(", ")} (got "${String(issue.input)}").` })),
  ),
  // Never echo the value: it's an API key.
  HIRETIVO_TYPESAFE_KEY: optional(z.string().trim()),
  // Google sign-in for Gmail and Calendar (E15-1): an OAuth client of type
  // "Web application". Settings → Google can save one instead, which wins.
  // Never echo the secret.
  HIRETIVO_GOOGLE_CLIENT_ID: optional(z.string().trim()),
  HIRETIVO_GOOGLE_CLIENT_SECRET: optional(z.string().trim()),
  // Optional shared Calendar authorization service. No request is made to it
  // unless the user explicitly chooses the one-click Calendar connection.
  HIRETIVO_CALENDAR_BRIDGE_URL: optional(
    z.url({ protocol: /^https?$/, error: "HIRETIVO_CALENDAR_BRIDGE_URL must be an HTTPS URL." })
      .refine((value) => value.startsWith("https://") || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(value), "Calendar bridge must use HTTPS, except on localhost.")
      .transform((url) => url.replace(/\/+$/, "")),
  ),
  // The address Hiretivo is reached at, e.g. https://hiretivo.example.com, for
  // Google's redirect. Defaults to the address of the request that connects.
  HIRETIVO_PUBLIC_URL: optional(
    z.url({ protocol: /^https?$/, error: "HIRETIVO_PUBLIC_URL must be an http:// or https:// URL." }).transform((url) => url.replace(/\/+$/, "")),
  ),
  // For the end-to-end tests only: sends every job source's requests to
  // <url>/<source> instead, where a fake source answers (e2e/fake-jobs.mts).
  HIRETIVO_JOBS_TEST_BASE_URL: optional(
    z.url({ protocol: /^https?$/, error: "HIRETIVO_JOBS_TEST_BASE_URL must be an http:// or https:// URL." }),
  ),
  // For the end-to-end tests only: sends Google's sign-in, Gmail and Calendar
  // requests to <url>/<host> instead, where a fake Google answers
  // (e2e/fake-google.mts).
  HIRETIVO_GOOGLE_TEST_BASE_URL: optional(
    z.url({ protocol: /^https?$/, error: "HIRETIVO_GOOGLE_TEST_BASE_URL must be an http:// or https:// URL." }),
  ),
  // Set by the desktop app on a server it starts: the token it signs in with
  // for this launch (desktop.ts). Never set on a server otherwise.
  HIRETIVO_DESKTOP_TOKEN: optional(z.string()),
  // And where it prints PDFs (pdf/desktop-print.ts), with its own Chromium.
  HIRETIVO_DESKTOP_PRINT_URL: optional(z.url({ protocol: /^https?$/, error: "HIRETIVO_DESKTOP_PRINT_URL must be an http:// or https:// URL." })),
  // For the end-to-end tests only: sends Jev's requests to <url> instead of
  // TypeSafe's API (e2e/fake-jobs.mts answers).
  HIRETIVO_TYPESAFE_TEST_BASE_URL: optional(
    z.url({ protocol: /^https?$/, error: "HIRETIVO_TYPESAFE_TEST_BASE_URL must be an http:// or https:// URL." }),
  ),
}).check((context) => {
  if (context.value.HIRETIVO_DEPLOYMENT_MODE === "hosted") {
    for (const name of ["RESEND_API_KEY", "RESEND_FROM_EMAIL", "HIRETIVO_PUBLIC_URL"] as const) {
      if (!context.value[name]) context.issues.push({ code: "custom", input: undefined, message: `${name} is required in hosted mode.` });
    }
    if (context.value.DATABASE_URL.startsWith("file:")) context.issues.push({ code: "custom", input: undefined, message: "Hosted mode requires a PostgreSQL DATABASE_URL." });

  }

  if (context.value.HIRETIVO_JOBS_SOURCE === "arbeitsagentur" && context.value.HIRETIVO_JOBS_ARBEITSAGENTUR === "off") {
    context.issues.push({
      code: "custom",
      input: context.value,
      message: "HIRETIVO_JOBS_SOURCE is arbeitsagentur, but HIRETIVO_JOBS_ARBEITSAGENTUR is off. Choose another source, or remove one of the two.",
    });
  }
});

export type Env = z.infer<typeof schema>;

/** Thrown when the environment is invalid; `problems` has one message per variable. */
export class EnvError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid environment:\n${problems.join("\n")}`);
    this.name = "EnvError";
  }
}

/** Validates the environment. Messages name the variable and how to fix it, never its value. */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = schema.safeParse(source);
  const problems = result.success ? [] : result.error.issues.map((issue) => issue.message);
  if (result.success && source.HIRETIVO_DEPLOYMENT_MODE === "hosted" && result.data.HIRETIVO_PUBLIC_URL) {
    const origin = result.data.HIRETIVO_PUBLIC_URL;
    const url = new URL(origin);
    if (!isLocalDevelopmentOrigin(origin, source.NODE_ENV ?? "") && (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/")) {
      problems.push("HIRETIVO_PUBLIC_URL must be an HTTPS origin without credentials, a path, query, or fragment in hosted mode. HTTP loopback origins are allowed only in development.");
    }
  }
  if (source.HIRETIVO_DEPLOYMENT_MODE !== "hosted" && !source.HIRETIVO_PASSWORD?.trim()) {
    problems.unshift("HIRETIVO_PASSWORD is not set. Set it to the password you want to sign in with in .env.");
  }
  if (result.success && source.HIRETIVO_DEPLOYMENT_MODE === "hosted" && !result.data.DATABASE_URL.startsWith("file:")) {
    const host = new URL(result.data.DATABASE_URL).hostname;
    if (host.endsWith(".neon.tech") && host.includes("-pooler.")) problems.push("Hosted mode requires a direct Neon DATABASE_URL. Disable connection pooling in Neon: account schemas need session settings and advisory locks.");
  }
  if (problems.length) throw new EnvError(problems);
  if (!result.success) throw new EnvError(["Invalid environment."]);
  return result.data;
}

let cached: Env | undefined;

function load(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}

/**
 * The validated environment. It's parsed on first use rather than on import,
 * so `next build` works without the secrets; `checkEnvOnStartup()` makes sure
 * a running server has them.
 */
export const env: Readonly<Env> = new Proxy({} as Env, {
  get: (_, key) => load()[key as keyof Env],
});

/** Called once from `register()` in instrumentation.ts: stops the server if the environment is invalid. */
export function checkEnvOnStartup(): void {
  try {
    load();
  } catch (error) {
    if (!(error instanceof EnvError)) throw error;
    for (const problem of error.problems) {
      console.error(`Hiretivo can't start: ${problem}`);
    }
    process.exit(1);
  }
}
