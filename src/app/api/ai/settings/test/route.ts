import { AIProvider } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { decryptProviderSecret } from "@/lib/ai/provider-secret";
import { SELF_HOSTED } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter("ai-test", 5, "1 m");
const inputSchema = z.object({ apiKey: z.string().trim().min(1).max(500).optional(), model: z.string().trim().min(1).max(200).optional() });

/* Make a minimal generation request to verify the chosen OpenRouter connection. */
export async function POST(request: Request) {
  if (!SELF_HOSTED) return new NextResponse(null, { status: 404 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await limiter.limit(session.user.id)).success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid test request" }, { status: 400 });
  const current = await prisma.aISettings.findUnique({ where: { userId: session.user.id } });
  const apiKey = parsed.data.apiKey ?? (current?.provider === AIProvider.OPENROUTER && current.encryptedApiKey
    ? decryptProviderSecret(current.encryptedApiKey) : null);
  const model = parsed.data.model ?? current?.model;
  if (!apiKey || !model) return NextResponse.json({ error: "Enter a key and choose a model" }, { status: 400 });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://hiretivo.com", "X-Title": "Hiretivo" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply with OK." }], max_tokens: 12 }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return NextResponse.json({ error: "The model connection failed. Check the key, model, and provider limits." }, { status: 422 });
    const result = await response.json();
    if (!result?.choices?.[0]?.message?.content) throw new Error("Empty response");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "The model connection failed. Try again later." }, { status: 502 });
  }
}
