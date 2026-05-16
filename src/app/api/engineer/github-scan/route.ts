import { NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import {
  GITHUB_ANALYSIS_CONFIG,
  GITHUB_ANALYSIS_PROMPT,
  type GithubAnalysisOutput,
} from "@/lib/ai-prompts";
import { openrouter } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import {
  createRateLimiter,
  getRateLimitIp,
} from "@/lib/rate-limit";
import { isAdminSession } from "@/lib/admin/is-admin";

/*
 * POST /api/engineer/github-scan
 * Scans a GitHub profile for an engineer applying for verification.
 * Called by the admin review page on open. Returns AI recommendation,
 * confidence, scoreSuggestion, reasons, and summary from Claude Haiku.
 * Rate limited: 5 req/min per IP (admin-only, low volume).
 * Auth: admin session required (ADMIN_EMAIL check).
 * Body: { engineerId: string }
 * Returns: { status: "ok", data: GithubAnalysisOutput, aiSummary: AiSummaryShape }
 *        | { status: "inaccessible", reason: "github_inaccessible" }
 *        | { status: "private", reason: "no_public_repos" }
 *        | { status: "error", reason: "ai_unavailable" }
 */

const githubScanLimiter = createRateLimiter("github-scan", 5, "1 m");

const scanBodySchema = z.object({
  engineerId: z.string().cuid(),
});

/** LOCKED aiSummary shape (from 12-CONTEXT.md) */
interface AiSummaryShape {
  model: string;
  promptVersion: string;
  inputSnapshot: {
    repos: number;
    languages: string[];
    lastCommit: string;
    starCount: number;
  };
  output: GithubAnalysisOutput;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !isAdminSession(session)) {
    return new Response("Forbidden", { status: 403 });
  }

  const ip = getRateLimitIp(req);
  const { success } = await githubScanLimiter.limit(ip);
  if (!success) {
    return new Response("Too Many Requests", { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = scanBodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid engineerId", { status: 400 });
  }

  const { engineerId } = parsed.data;

  try {
    // Fetch engineer + their GitHub username
    const engineer = await prisma.user.findUnique({
      where: { id: engineerId },
      select: {
        id: true,
        seekerProfile: {
          select: { githubUsername: true },
        },
      },
    });

    if (!engineer) {
      return Response.json(
        { status: "inaccessible", reason: "github_inaccessible" },
        { status: 200 },
      );
    }

    const username = engineer.seekerProfile?.githubUsername;
    if (!username) {
      return Response.json(
        { status: "inaccessible", reason: "github_inaccessible" },
        { status: 200 },
      );
    }

    // Fetch GitHub profile and repos
    const token = process.env.GITHUB_TOKEN;
    const authHeaders: Record<string, string> = {
      Accept: "application/vnd.github+json",
    };
    if (token) {
      authHeaders.Authorization = `Bearer ${token}`;
    }

    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, {
        headers: authHeaders,
      }),
      fetch(
        `https://api.github.com/users/${username}/repos?sort=pushed&per_page=10`,
        { headers: authHeaders },
      ),
    ]);

    if (userRes.status === 404) {
      return Response.json(
        { status: "inaccessible", reason: "github_inaccessible" },
        { status: 200 },
      );
    }
    if (!userRes.ok || !reposRes.ok) {
      return Response.json(
        { status: "error", reason: "ai_unavailable" },
        { status: 200 },
      );
    }

    const reposData = (await reposRes.json()) as Array<{
      private: boolean;
      pushed_at: string;
      stargazers_count: number;
      language: string | null;
    }>;

    const publicRepos = reposData.filter((r) => !r.private);
    if (publicRepos.length === 0) {
      return Response.json(
        { status: "private", reason: "no_public_repos" },
        { status: 200 },
      );
    }

    // Build sanitized inputSnapshot — no raw description text
    const languages = [
      ...new Set(
        publicRepos
          .map((r) => r.language)
          .filter((l): l is string => l !== null),
      ),
    ];
    const inputSnapshot = {
      repos: publicRepos.length,
      languages,
      lastCommit: publicRepos[0]?.pushed_at ?? "",
      starCount: publicRepos.reduce(
        (sum, r) => sum + r.stargazers_count,
        0,
      ),
    };

    // Replace {GITHUB_DATA} in prompt with JSON snapshot
    const prompt = (GITHUB_ANALYSIS_PROMPT as string).replace(
      "{GITHUB_DATA}",
      JSON.stringify(inputSnapshot, null, 2),
    );

    // Call Claude Haiku via OpenRouter
    const completion = await openrouter.chat.completions.create({
      model: "anthropic/claude-haiku-3",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: GITHUB_ANALYSIS_CONFIG.max_tokens,
      temperature: GITHUB_ANALYSIS_CONFIG.temperature,
    });

    const rawOutput = completion.choices[0]?.message?.content;
    if (!rawOutput) {
      return Response.json(
        { status: "error", reason: "ai_unavailable" },
        { status: 200 },
      );
    }

    // Parse and validate AI output
    let aiOutput: unknown;
    try {
      aiOutput = JSON.parse(rawOutput) as unknown;
    } catch {
      return Response.json(
        { status: "error", reason: "ai_unavailable" },
        { status: 200 },
      );
    }

    const aiOutputSchema = z.object({
      recommendation: z.enum(["APPROVE", "REJECT"]),
      confidence: z.number().min(0).max(1),
      scoreSuggestion: z.number().int().min(0).max(100),
      reasons: z.array(z.string()),
      summary: z.string(),
    });

    const parsedOutput = aiOutputSchema.parse(aiOutput);

    // Build LOCKED aiSummary shape
    const aiSummary: AiSummaryShape = {
      model: "claude-haiku-3",
      promptVersion: "1.0.0",
      inputSnapshot,
      output: parsedOutput,
    };

    // Persist aiSummary to the latest PENDING review for this engineer
    const latestReview = await prisma.verificationReview.findFirst({
      where: { userId: engineerId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (latestReview) {
      await prisma.verificationReview.update({
        where: { id: latestReview.id },
        data: { aiSummary: JSON.parse(JSON.stringify(aiSummary)) },
      });
    }

    // Update User verificationStatus to IN_REVIEW
    await prisma.user.update({
      where: { id: engineerId },
      data: { verificationStatus: "IN_REVIEW" },
    });

    return Response.json({
      status: "ok",
      data: parsedOutput,
      aiSummary,
    });
  } catch (error: unknown) {
    console.error("[github-scan] AI scan failed:", error);
    return Response.json(
      { status: "error", reason: "ai_unavailable" },
      { status: 200 },
    );
  }
}
