import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getEmailVerificationStatus } from "@/lib/auth/email-verification";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getEmailVerificationStatus(session.user.id);
  if (!status) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ data: status });
}
