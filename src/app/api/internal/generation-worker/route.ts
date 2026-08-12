import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { runApplicationGeneration } from "@/lib/generation/run-application-generation";
import { parseGenerationJob } from "@/lib/generation/qstash";

export const maxDuration = 60;

/* Verifies and executes one QStash resume-generation delivery. */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("upstash-signature");
  const body = await request.text();
  if (!signature || !process.env.QSTASH_CURRENT_SIGNING_KEY || !process.env.QSTASH_NEXT_SIGNING_KEY) {
    return NextResponse.json({ error: "Worker is not configured" }, { status: 503 });
  }

  try {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    });
    await receiver.verify({ signature, body, url: request.url });
    const message = parseGenerationJob(JSON.parse(body));
    await runApplicationGeneration(message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[generation-worker] Failed:", error);
    return NextResponse.json({ error: "Generation worker failed" }, { status: 500 });
  }
}
