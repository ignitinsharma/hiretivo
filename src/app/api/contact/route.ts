import { NextRequest, NextResponse } from "next/server";

import { sendContactSupportEmail } from "@/lib/email/contact-support";
import { createRateLimiter } from "@/lib/rate-limit";
import { ContactSupportSchema } from "@/lib/validations/contact.schema";

const contactSupportRateLimiter = createRateLimiter("contact-support", 5, "1 m");

function getRateLimitIdentifier(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim();

  return ip || "anonymous";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { success } = await contactSupportRateLimiter.limit(
    getRateLimitIdentifier(req),
  );

  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = ContactSupportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await sendContactSupportEmail(parsed.data);
  } catch (error) {
    console.error("[contact] failed to send support email:", error);
    return NextResponse.json(
      { error: "Could not send contact request" },
      { status: 500 },
    );
  }

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
