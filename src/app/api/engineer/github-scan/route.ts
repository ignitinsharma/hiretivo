import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { UserRole } from "@/constants/enums";
import { applyRateLimiter } from "@/lib/rate-limit";

const githubScanSchema = z.object({
  githubUrl: z
    .string()
    .regex(/^https:\/\/github\.com\/.+/, "Must be a valid GitHub profile URL"),
});

/*
 * POST /api/engineer/github-scan
 * Performs a Phase 9 non-AI GitHub profile check against api.github.com.
 * Returns scan status and public repo count without fetching user-provided URLs.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== UserRole.SEEKER) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await applyRateLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = githubScanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
  }

  const username = parsed.data.githubUrl
    .replace("https://github.com/", "")
    .split("/")[0];
  if (!username) {
    return NextResponse.json(
      { error: "Could not extract username from URL" },
      { status: 400 },
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const apiRes = await fetch(`https://api.github.com/users/${username}`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (apiRes.status === 404) {
      return NextResponse.json({ status: "not_found" });
    }
    if (!apiRes.ok) {
      return NextResponse.json({ status: "timeout" });
    }

    const data = (await apiRes.json()) as {
      public_repos?: number;
      type?: string;
    };
    if (data.type === "Organization") {
      return NextResponse.json({ status: "not_found" });
    }

    const publicRepoCount = data.public_repos ?? 0;
    if (publicRepoCount === 0) {
      return NextResponse.json({ status: "private", publicRepoCount });
    }

    return NextResponse.json({ status: "success", publicRepoCount });
  } catch (error: unknown) {
    if (error instanceof Error && error.name !== "AbortError") {
      console.error("[github-scan] GitHub API check failed:", error);
    }
    return NextResponse.json({ status: "timeout" });
  }
}
