import { AIProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { fetchOpenRouterModels } from "@/lib/ai/openrouter-models";
import { decryptProviderSecret, encryptProviderSecret } from "@/lib/ai/provider-secret";
import { SELF_HOSTED } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter("ai-settings", 10, "1 m");
const inputSchema = z.object({
  provider: z.literal(AIProvider.OPENROUTER),
  model: z.string().trim().min(1).max(200),
  apiKey: z.string().trim().min(1).max(500).optional(),
});

/* Return only public model settings; stored credentials never reach the browser. */
export async function GET() {
  if (!SELF_HOSTED) return new NextResponse(null, { status: 404 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await prisma.aISettings.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ data: settings ? {
    provider: settings.provider,
    model: settings.model,
    hasKey: Boolean(settings.encryptedApiKey),
    supportsFile: settings.supportsFile,
  } : null });
}

/* Validate a model against the live catalog before saving its encrypted key. */
export async function PUT(request: Request) {
  if (!SELF_HOSTED) return new NextResponse(null, { status: 404 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await limiter.limit(session.user.id)).success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid model settings" }, { status: 400 });

  const current = await prisma.aISettings.findUnique({ where: { userId: session.user.id } });
  const apiKey = parsed.data.apiKey ?? (current?.provider === AIProvider.OPENROUTER && current.encryptedApiKey
    ? decryptProviderSecret(current.encryptedApiKey) : null);
  if (!apiKey) return NextResponse.json({ error: "Enter an OpenRouter API key" }, { status: 400 });

  let models;
  try { models = await fetchOpenRouterModels(apiKey); }
  catch { return NextResponse.json({ error: "Could not verify the OpenRouter key or model list" }, { status: 422 }); }
  const selected = models.find((model) => model.id === parsed.data.model);
  if (!selected) return NextResponse.json({ error: "Choose a current text-capable OpenRouter model" }, { status: 422 });

  await prisma.aISettings.upsert({
    where: { userId: session.user.id },
    update: { provider: AIProvider.OPENROUTER, model: selected.id, supportsFile: selected.supportsFile, encryptedApiKey: encryptProviderSecret(apiKey), endpoint: null },
    create: { userId: session.user.id, provider: AIProvider.OPENROUTER, model: selected.id, supportsFile: selected.supportsFile, encryptedApiKey: encryptProviderSecret(apiKey) },
  });
  return NextResponse.json({ data: { provider: AIProvider.OPENROUTER, model: selected.id, hasKey: true, supportsFile: selected.supportsFile } });
}

/* Remove the selected model and encrypted credential for this user. */
export async function DELETE() {
  if (!SELF_HOSTED) return new NextResponse(null, { status: 404 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.aISettings.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ success: true });
}
