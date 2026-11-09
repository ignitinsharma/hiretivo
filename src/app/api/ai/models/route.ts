import { AIProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { fetchOpenRouterModels } from "@/lib/ai/openrouter-models";
import { decryptProviderSecret } from "@/lib/ai/provider-secret";
import { SELF_HOSTED } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter("ai-models", 10, "1 m");
const inputSchema = z.object({ apiKey: z.string().trim().min(1).max(500).optional() });

/* List live OpenRouter models using a submitted or saved key, never returning the key. */
export async function POST(request: Request) {
  if (!SELF_HOSTED) return new NextResponse(null, { status: 404 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await limiter.limit(session.user.id)).success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const current = parsed.data.apiKey ? null : await prisma.aISettings.findUnique({ where: { userId: session.user.id } });
  const apiKey = parsed.data.apiKey ?? (current?.provider === AIProvider.OPENROUTER && current.encryptedApiKey
    ? decryptProviderSecret(current.encryptedApiKey) : null);
  if (!apiKey) return NextResponse.json({ error: "Enter an OpenRouter API key" }, { status: 400 });
  try {
    const models = await fetchOpenRouterModels(apiKey);
    return NextResponse.json({ data: models });
  } catch {
    return NextResponse.json({ error: "Could not load OpenRouter models. Check the key and connection." }, { status: 502 });
  }
}
