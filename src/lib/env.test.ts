import path from "node:path";

import { describe, expect, it } from "vitest";

import { EnvError, parseEnv } from "./env";

// A hash of "correct horse" (scripts/hash-password.ts).
const PASSWORD_HASH = "argon2id:m=19456,t=2,p=1:CLZW5wQoCjh3Q9CHBp_JWw:Ak2xS7TYlYYrhemlgBkVxFmWXfcMq_rjd0mJGZcZFfA";

const valid = {
  HIRETIVO_PASSWORD: PASSWORD_HASH,
  HIRETIVO_SECRET: "a".repeat(32),
  DATABASE_URL: "postgresql://postgres:postgres@db:5432/hiretivo",
};

function problems(source: Record<string, string | undefined>): string[] {
  try {
    parseEnv(source);
  } catch (error) {
    if (error instanceof EnvError) return error.problems;
    throw error;
  }
  throw new Error("Expected parseEnv to throw");
}

describe("parseEnv", () => {
  it("accepts the required variables and fills in defaults", () => {
    expect(parseEnv(valid)).toEqual({
      ...valid,
      HIRETIVO_DATA_DIR: "/data",
      HIRETIVO_BACKUP_RETENTION_DAYS: 14,
    });
  });

  it("reads the optional variables", () => {
    const env = parseEnv({
      ...valid,
      HIRETIVO_DATA_DIR: "/srv/hiretivo",
      HIRETIVO_BACKUP_RETENTION_DAYS: "30",
      HIRETIVO_AI_PROVIDER: "local",
      HIRETIVO_AI_URL: "http://ollama:11434",
      HIRETIVO_AI_MODEL: "llama3.1:8b",
      HIRETIVO_AI_KEY: "sk-test",
    });
    expect(env).toMatchObject({
      HIRETIVO_DATA_DIR: "/srv/hiretivo",
      HIRETIVO_BACKUP_RETENTION_DAYS: 30,
      HIRETIVO_AI_PROVIDER: "local",
      HIRETIVO_AI_URL: "http://ollama:11434",
      HIRETIVO_AI_MODEL: "llama3.1:8b",
      HIRETIVO_AI_KEY: "sk-test",
    });
  });

  it("reads the AI timeout in seconds", () => {
    expect(parseEnv({ ...valid, HIRETIVO_AI_TIMEOUT_SECONDS: " 300 " }).HIRETIVO_AI_TIMEOUT_SECONDS).toBe(300);
    expect(() => parseEnv({ ...valid, HIRETIVO_AI_TIMEOUT_SECONDS: "5m" })).toThrow(/whole number of seconds/);
    expect(() => parseEnv({ ...valid, HIRETIVO_AI_TIMEOUT_SECONDS: "1" })).toThrow(/at least 5/);
  });

  it("resolves a relative data directory", () => {
    const env = parseEnv({ ...valid, HIRETIVO_DATA_DIR: "./data" });
    expect(env.HIRETIVO_DATA_DIR).toBe(path.resolve("data"));
  });

  it("treats empty values as unset", () => {
    const env = parseEnv({ ...valid, HIRETIVO_AI_KEY: "", HIRETIVO_DATA_DIR: " " });
    expect(env.HIRETIVO_AI_KEY).toBeUndefined();
    expect(env.HIRETIVO_DATA_DIR).toBe("/data");
    expect(problems({ ...valid, HIRETIVO_PASSWORD: "" })).toEqual([
      expect.stringMatching(/^HIRETIVO_PASSWORD is not set\./),
    ]);
  });

  it("names every missing required variable", () => {
    expect(problems({})).toEqual([
      expect.stringMatching(/^HIRETIVO_PASSWORD is not set\. Set it to/),
      expect.stringMatching(/^HIRETIVO_SECRET is not set\. .*openssl rand/),
      expect.stringMatching(/^DATABASE_URL is not set\. /),
    ]);
  });

  it("takes an SQLite file as the database, by its full path", () => {
    expect(parseEnv({ ...valid, DATABASE_URL: "file:/data/hiretivo.db" }).DATABASE_URL).toBe("file:/data/hiretivo.db");
    expect(problems({ ...valid, DATABASE_URL: "file:./hiretivo.db" })).toEqual([
      "DATABASE_URL must give the SQLite file's full path, e.g. file:/data/hiretivo.db.",
    ]);
  });

  it("accepts a plain password and existing password hashes", () => {
    expect(parseEnv({ ...valid, HIRETIVO_PASSWORD: "correct horse" }).HIRETIVO_PASSWORD).toBe("correct horse");
    expect(parseEnv({ ...valid, HIRETIVO_PASSWORD: ` ${PASSWORD_HASH}\n` }).HIRETIVO_PASSWORD).toBe(PASSWORD_HASH);
  });

  it("rejects a secret shorter than 32 characters", () => {
    expect(problems({ ...valid, HIRETIVO_SECRET: "short" })).toEqual([
      expect.stringMatching(/^HIRETIVO_SECRET is too short \(5 characters\)\./),
    ]);
  });

  it("never echoes secret values", () => {
    const messages = problems({
      HIRETIVO_PASSWORD: "hunter2",
      HIRETIVO_SECRET: "tiny-secret",
      DATABASE_URL: "mysql://root:db-password@db/hiretivo",
    }).join("\n");
    expect(messages).not.toContain("hunter2");
    expect(messages).not.toContain("tiny-secret");
    expect(messages).not.toContain("db-password");
    expect(messages).toMatch(/DATABASE_URL must be a PostgreSQL connection string/);
  });

  it("rejects invalid optional values", () => {
    expect(
      problems({
        ...valid,
        HIRETIVO_BACKUP_RETENTION_DAYS: "two weeks",
        HIRETIVO_AI_PROVIDER: "unknown",
        HIRETIVO_AI_URL: "ftp://example.com",
      }),
    ).toEqual([
      'HIRETIVO_BACKUP_RETENTION_DAYS must be a whole number of days (got "two weeks").',
      'HIRETIVO_AI_PROVIDER must be one of local, openai, anthropic, mistral, gemini, groq, openrouter, lmstudio (got "unknown").',
      "HIRETIVO_AI_URL must be an http:// or https:// URL.",
    ]);
    expect(problems({ ...valid, HIRETIVO_BACKUP_RETENTION_DAYS: "0" })).toEqual([
      "HIRETIVO_BACKUP_RETENTION_DAYS must be at least 1.",
    ]);
  });
});

describe("job search variables (E14-4)", () => {
  it("reads the source and its keys", () => {
    expect(
      parseEnv({
        ...valid,
        HIRETIVO_JOBS_SOURCE: "jsearch",
        HIRETIVO_JSEARCH_KEY: "ak_test",
        HIRETIVO_JSEARCH_HOST: "rapidapi",
        HIRETIVO_ADZUNA_APP_ID: "app",
        HIRETIVO_ADZUNA_KEY: "adz",
        HIRETIVO_FREEHIRE_URL: "https://jobs.example/",
      }),
    ).toMatchObject({
      HIRETIVO_JOBS_SOURCE: "jsearch",
      HIRETIVO_JSEARCH_KEY: "ak_test",
      HIRETIVO_JSEARCH_HOST: "rapidapi",
      HIRETIVO_ADZUNA_APP_ID: "app",
      HIRETIVO_ADZUNA_KEY: "adz",
      HIRETIVO_FREEHIRE_URL: "https://jobs.example",
    });
    expect(parseEnv({ ...valid, HIRETIVO_JOBS_SOURCE: "freehire" }).HIRETIVO_JOBS_SOURCE).toBe("freehire");
  });

  it("reads whether the Bundesagentur für Arbeit is offered, and refuses choosing it while it's off (#223)", () => {
    expect(parseEnv(valid).HIRETIVO_JOBS_ARBEITSAGENTUR).toBeUndefined();
    expect(parseEnv({ ...valid, HIRETIVO_JOBS_ARBEITSAGENTUR: " OFF " }).HIRETIVO_JOBS_ARBEITSAGENTUR).toBe("off");
    expect(problems({ ...valid, HIRETIVO_JOBS_ARBEITSAGENTUR: "no" })).toEqual(['HIRETIVO_JOBS_ARBEITSAGENTUR must be on or off (got "no").']);
    expect(problems({ ...valid, HIRETIVO_JOBS_SOURCE: "arbeitsagentur", HIRETIVO_JOBS_ARBEITSAGENTUR: "off" })).toEqual([
      "HIRETIVO_JOBS_SOURCE is arbeitsagentur, but HIRETIVO_JOBS_ARBEITSAGENTUR is off. Choose another source, or remove one of the two.",
    ]);
  });

  it("rejects sources and hosts it doesn't know, without echoing keys", () => {
    expect(problems({ ...valid, HIRETIVO_JOBS_SOURCE: "linkedin", HIRETIVO_JSEARCH_HOST: "google", HIRETIVO_JSEARCH_KEY: "ak_secret" })).toEqual([
      'HIRETIVO_JOBS_SOURCE must be one of jsearch, adzuna, arbeitsagentur, freehire, off (got "linkedin").',
      'HIRETIVO_JSEARCH_HOST must be openwebninja or rapidapi (got "google").',
    ]);
  });
});


describe("hosted environment", () => {
  const hosted = { HIRETIVO_DEPLOYMENT_MODE: "hosted", HIRETIVO_SECRET: "x".repeat(32), DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/hiretivo", HIRETIVO_PUBLIC_URL: "https://hiretivo.com", RESEND_API_KEY: "mail-test-key", RESEND_FROM_EMAIL: "Hiretivo <noreply@hiretivo.com>" };
  it("rejects Neon pooling for session-scoped account workspaces", () => {
    expect(() => parseEnv({ ...hosted, DATABASE_URL: "postgresql://user:password@ep-demo-pooler.us-east-2.aws.neon.tech/app" })).toThrow("direct Neon");
    expect(parseEnv({ ...hosted, DATABASE_URL: "postgresql://user:password@ep-demo.us-east-2.aws.neon.tech/app" }).DATABASE_URL).toContain("ep-demo.");
  });
  it("does not require an ENV password for hosted accounts", () => {
    expect(parseEnv(hosted)).toMatchObject({ HIRETIVO_DEPLOYMENT_MODE: "hosted", HIRETIVO_PASSWORD: "" });
  });
  it("requires email delivery configuration and rejects SQLite", () => {
    expect(() => parseEnv({ ...hosted, RESEND_API_KEY: undefined })).toThrow("RESEND_API_KEY");
    expect(() => parseEnv({ ...hosted, DATABASE_URL: "file:/tmp/hosted.db" })).toThrow("PostgreSQL");
  });
  it("accepts localhost for development and refuses it in production", () => {
    const local = { ...hosted, HIRETIVO_PUBLIC_URL: "http://localhost:3000" };
    expect(parseEnv({ ...local, NODE_ENV: "development" }).HIRETIVO_PUBLIC_URL).toBe("http://localhost:3000");
    expect(() => parseEnv({ ...local, NODE_ENV: "production" })).toThrow("HTTPS origin");
    expect(() => parseEnv({ ...hosted, HIRETIVO_PUBLIC_URL: "http://localhost.evil.test", NODE_ENV: "development" })).toThrow("HTTPS origin");
  });
  it("keeps account links on a configured HTTPS origin", () => {
    for (const HIRETIVO_PUBLIC_URL of ["http://hiretivo.com", "https://hiretivo.com/wrong", "https://name:secret@hiretivo.com", "https://hiretivo.com?wrong=1"]) expect(() => parseEnv({ ...hosted, HIRETIVO_PUBLIC_URL })).toThrow("HTTPS origin");
  });
});
