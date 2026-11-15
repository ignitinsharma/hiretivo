import { afterEach, describe, expect, it, vi } from "vitest";

import { encryptApiKey } from "./api-key";
import { resolveAiConfig } from "./config";
import { assertHostedAiAllowed, availableProviderOptions, HOSTED_AI_ENDPOINTS, hostedAiProblem } from "./hosted-policy";
import { createProvider } from "./index";
import { resolveJobSearchConfig, requestContext } from "@/lib/job-search/config";
import { resolveScoringConfig } from "@/lib/scoring/config";
import { encryptSecret, JOB_SOURCE_KEY, TYPESAFE_KEY } from "@/lib/secrets";

vi.mock("@/lib/env", () => ({ env: { HIRETIVO_SECRET: "a".repeat(32) } }));
vi.mock("@/lib/settings-data", () => ({ loadSettings: vi.fn() }));

afterEach(() => vi.unstubAllEnvs());

describe("hosted BYOK policy", () => {
  it("offers only official cloud providers and presents OpenAI as OpenAI", () => {
    const options = availableProviderOptions(true);
    expect(options.map((option) => option.value)).toEqual(["OPENAI", "ANTHROPIC", "MISTRAL", "GEMINI", "GROQ", "OPENROUTER"]);
    expect(options.find((option) => option.value === "OPENAI")).toMatchObject({ name: "OpenAI", defaultUrl: "https://api.openai.com/v1" });
    expect(availableProviderOptions(false).some((option) => option.value === "LOCAL")).toBe(true);
  });

  it("refuses local models and endpoint tricks before any network request", () => {
    vi.stubEnv("HIRETIVO_DEPLOYMENT_MODE", "hosted");
    for (const baseUrl of ["http://localhost:11434", "https://api.openai.com.evil.test/v1", "https://api.openai.com/v1?url=http://localhost", "https://api.openai.com@127.0.0.1/v1", "https://api.openai.com/v1/../../", "https://api.openai.com/v1#fragment"]) {
      expect(() => assertHostedAiAllowed("OPENAI", baseUrl)).toThrow();
      expect(() => createProvider({ provider: "OPENAI", baseUrl, model: "test", apiKey: "user-key", apiKeyProblem: null, timeoutMs: 1000 })).toThrow();
    }
    expect(() => assertHostedAiAllowed("LOCAL", "http://localhost:11434")).toThrow(/self-host/);
    for (const [provider, endpoint] of Object.entries(HOSTED_AI_ENDPOINTS)) {
      expect(hostedAiProblem(provider as keyof typeof HOSTED_AI_ENDPOINTS, endpoint!)).toBeNull();
    }
  });

  it("starts hosted accounts with no operator credentials or provider defaults", () => {
    vi.stubEnv("HIRETIVO_DEPLOYMENT_MODE", "hosted");
    const config = resolveAiConfig(null, { HIRETIVO_AI_PROVIDER: "groq", HIRETIVO_AI_KEY: "operator-secret", HIRETIVO_AI_MODEL: "operator-model", HIRETIVO_AI_URL: "http://private-network" });
    expect(config).toMatchObject({ provider: "OPENAI", baseUrl: "https://api.openai.com/v1", apiKey: null, model: null });
    expect(() => createProvider({ ...config, model: "test" })).toThrow(/own API key/);
    const personal = resolveAiConfig({ provider: "GROQ", baseUrl: "https://api.groq.com/openai/v1", model: "personal-model", apiKeyEnc: encryptApiKey("personal-secret") }, { HIRETIVO_AI_PROVIDER: "groq", HIRETIVO_AI_KEY: "operator-secret" });
    expect(personal.apiKey).toBe("personal-secret");
    expect(() => resolveAiConfig({ provider: "LOCAL", baseUrl: "http://localhost", model: "test", apiKeyEnc: null }, {})).toThrow();
  });

  it("does not inherit operator job-source or scoring credentials", () => {
    vi.stubEnv("HIRETIVO_DEPLOYMENT_MODE", "hosted");
    const saved = { jobSource: "JSEARCH" as const, jsearchKeyEnc: null, jsearchHost: "openwebninja" as const, adzunaAppId: null, adzunaKeyEnc: null, arbeitsagenturAcceptedAt: null };
    const config = resolveJobSearchConfig(saved, { HIRETIVO_JSEARCH_KEY: "operator-key", HIRETIVO_ADZUNA_KEY: "operator-key", HIRETIVO_ADZUNA_APP_ID: "operator-id", HIRETIVO_FREEHIRE_URL: "http://internal" });
    expect(config).toMatchObject({ jsearch: { key: null }, adzuna: { appId: "", key: null }, freehire: { url: "https://freehire.me" } });
    expect(resolveJobSearchConfig({ ...saved, jsearchKeyEnc: encryptSecret(JOB_SOURCE_KEY, "personal-job-key") }, {}).jsearch.key).toBe("personal-job-key");
    expect(requestContext("FREEHIRE", "http://internal", "http://internal")).toEqual({});
    expect(resolveScoringConfig({ scorer: null, typesafeKeyEnc: null }, { HIRETIVO_SCORER: "jev", HIRETIVO_TYPESAFE_KEY: "operator-key" })).toMatchObject({ scorer: "AI", key: null });
    expect(resolveScoringConfig({ scorer: "JEV", typesafeKeyEnc: encryptSecret(TYPESAFE_KEY, "personal-scoring-key") }, {}).key).toBe("personal-scoring-key");
  });

  it("preserves local models and ENV credentials for self-hosted installations", () => {
    vi.stubEnv("HIRETIVO_DEPLOYMENT_MODE", "self-hosted");
    expect(() => assertHostedAiAllowed("LOCAL", "http://localhost:11434")).not.toThrow();
    expect(resolveAiConfig(null, { HIRETIVO_AI_PROVIDER: "groq", HIRETIVO_AI_KEY: "local-env-key" }).apiKey).toBe("local-env-key");
  });
});
