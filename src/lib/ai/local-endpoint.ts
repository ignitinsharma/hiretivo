import { z } from "zod";

const allowedHosts = new Set(["localhost", "127.0.0.1", "[::1]", "host.docker.internal"]);

/** Keep local inference requests on the user's machine, including Docker's host bridge. */
export function normalizeLocalEndpoint(value: string): string {
  const parsed = z.string().trim().url().safeParse(value);
  if (!parsed.success) throw new Error("Enter a local OpenAI-compatible endpoint URL.");
  const url = new URL(parsed.data);
  if (url.protocol !== "http:" || !allowedHosts.has(url.hostname) || url.username || url.password || url.search || url.hash) {
    throw new Error("Use an http://localhost or http://host.docker.internal endpoint without credentials.");
  }
  const path = url.pathname.replace(/\/+$/, "");
  if (path !== "/v1") throw new Error("The local endpoint must end in /v1.");
  return `${url.origin}/v1`;
}

export async function fetchLocalModels(endpoint: string): Promise<string[]> {
  const response = await fetch(`${normalizeLocalEndpoint(endpoint)}/models`, {
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error("The local model server could not list models.");
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("data" in body) || !Array.isArray(body.data)) {
    throw new Error("The local model server returned an invalid model list.");
  }
  return body.data.flatMap((item: unknown) => item && typeof item === "object" && "id" in item && typeof item.id === "string" ? [item.id] : []);
}
