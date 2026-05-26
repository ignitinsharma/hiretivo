import { NextRequest } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { REJECTION_REASONS } from "@/constants/verification-reasons";
import {
  VERIFICATION_AI_REVIEW_CONFIG,
  VERIFICATION_AI_REVIEW_PROMPT,
} from "@/lib/ai-prompts";
import { isAdminSession } from "@/lib/admin/is-admin";
import { getAIModel, openrouter } from "@/lib/openrouter";
import { prisma } from "@/lib/prisma";
import { createRateLimiter, getRateLimitIp } from "@/lib/rate-limit";
import {
  buildVerificationAiEvidenceSnapshot,
  type VerificationGithubSnapshot,
} from "@/lib/verification/ai-review";

interface RouteContext {
  params: { id: string };
}

const aiReviewLimiter = createRateLimiter("verification-ai-review", 5, "1 m");

const rubricScoresSchema = z.object({
  github: z.number().int().min(0).max(30),
  projects: z.number().int().min(0).max(25),
  workHistory: z.number().int().min(0).max(20),
  profile: z.number().int().min(0).max(15),
  trust: z.number().int().min(0).max(10),
});

const aiOutputSchema = z.object({
  recommendation: z.enum(["APPROVE", "REJECT"]),
  confidence: z.number().min(0).max(1),
  scoreSuggestion: z.number().int().min(0).max(100),
  rubricScores: rubricScoresSchema,
  strengthLevel: z.enum(["WEAK", "PROMISING", "STRONG", "EXCEPTIONAL"]),
  reasons: z.array(z.string()).default([]),
  summary: z.string().max(1200),
  strengths: z.array(z.string()).max(6).default([]),
  gaps: z.array(z.string()).max(6).default([]),
});

const rejectionReasonKeys = new Set<string>(
  REJECTION_REASONS.map((reason) => reason.key),
);

async function getGithubSnapshot(
  username: string | null | undefined,
  profileUrl: string | null | undefined,
): Promise<VerificationGithubSnapshot> {
  if (!username?.trim()) {
    return {
      username: null,
      profileUrl: profileUrl ?? null,
      status: "missing",
      repos: 0,
      languages: [],
      lastCommit: null,
      starCount: 0,
    };
  }

  const token = process.env.GITHUB_TOKEN;
  const authHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) {
    authHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=30&type=public`,
      { headers: authHeaders },
    );

    if (reposRes.status === 404) {
      return {
        username,
        profileUrl: profileUrl ?? `https://github.com/${username}`,
        status: "inaccessible",
        repos: 0,
        languages: [],
        lastCommit: null,
        starCount: 0,
      };
    }

    if (!reposRes.ok) {
      return {
        username,
        profileUrl: profileUrl ?? `https://github.com/${username}`,
        status: "inaccessible",
        repos: 0,
        languages: [],
        lastCommit: null,
        starCount: 0,
      };
    }

    const reposData = (await reposRes.json()) as Array<{
      private: boolean;
      pushed_at: string | null;
      stargazers_count: number;
      language: string | null;
    }>;
    const publicRepos = reposData.filter((repo) => !repo.private);
    const languages = [
      ...new Set(
        publicRepos
          .map((repo) => repo.language)
          .filter((language): language is string => language !== null),
      ),
    ];

    return {
      username,
      profileUrl: profileUrl ?? `https://github.com/${username}`,
      status: publicRepos.length > 0 ? "ok" : "private",
      repos: publicRepos.length,
      languages,
      lastCommit: publicRepos[0]?.pushed_at ?? null,
      starCount: publicRepos.reduce(
        (sum, repo) => sum + repo.stargazers_count,
        0,
      ),
    };
  } catch {
    return {
      username,
      profileUrl: profileUrl ?? `https://github.com/${username}`,
      status: "inaccessible",
      repos: 0,
      languages: [],
      lastCommit: null,
      starCount: 0,
    };
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id || !isAdminSession(session)) {
    return new Response("Forbidden", { status: 403 });
  }

  const ip = getRateLimitIp(req);
  const { success } = await aiReviewLimiter.limit(ip);
  if (!success) {
    return new Response("Too Many Requests", { status: 429 });
  }

  const engineer = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      timezone: true,
      timezoneOverlapHours: true,
      availableFrom: true,
      verificationStatus: true,
      seekerProfile: {
        select: {
          headline: true,
          bio: true,
          primaryRole: true,
          location: true,
          yearsExperience: true,
          availability: true,
          githubUsername: true,
          githubUrl: true,
          videoIntroUrl: true,
          topProjects: true,
          codingProfiles: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          skills: {
            select: {
              skill: { select: { name: true } },
            },
          },
          workExperiences: {
            orderBy: { startDate: "desc" },
            select: {
              company: true,
              title: true,
              startDate: true,
              endDate: true,
              isCurrent: true,
              description: true,
              skills: true,
            },
          },
        },
      },
    },
  });

  if (!engineer) {
    return Response.json({ status: "error", reason: "not_found" }, { status: 404 });
  }

  if (
    engineer.verificationStatus !== "PENDING" &&
    engineer.verificationStatus !== "IN_REVIEW"
  ) {
    return Response.json(
      { status: "error", reason: "not_reviewable" },
      { status: 409 },
    );
  }

  const github = await getGithubSnapshot(
    engineer.seekerProfile?.githubUsername,
    engineer.seekerProfile?.githubUrl,
  );
  const inputSnapshot = buildVerificationAiEvidenceSnapshot(engineer, github);
  const prompt = VERIFICATION_AI_REVIEW_PROMPT.replace(
    "{PROFILE_EVIDENCE}",
    JSON.stringify(inputSnapshot, null, 2),
  );
  const model = getAIModel();

  try {
    const completion = await openrouter.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: VERIFICATION_AI_REVIEW_CONFIG.max_tokens,
      temperature: VERIFICATION_AI_REVIEW_CONFIG.temperature,
    });

    const rawOutput = completion.choices[0]?.message?.content;
    if (!rawOutput) {
      return Response.json({ status: "error", reason: "ai_unavailable" });
    }

    const parsedOutput = aiOutputSchema.parse(JSON.parse(rawOutput) as unknown);
    const output = {
      ...parsedOutput,
      reasons: parsedOutput.reasons.filter((reason) =>
        rejectionReasonKeys.has(reason),
      ),
    };
    const aiSummary = {
      model,
      promptVersion: "2.0.0",
      inputSnapshot,
      output,
    };

    const latestReview = await prisma.verificationReview.findFirst({
      where: { userId: params.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (latestReview) {
      await prisma.verificationReview.update({
        where: { id: latestReview.id },
        data: { aiSummary: JSON.parse(JSON.stringify(aiSummary)) },
      });
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { verificationStatus: "IN_REVIEW" },
    });

    return Response.json({
      status: "ok",
      data: output,
      aiSummary,
    });
  } catch (error: unknown) {
    console.error("[verification ai-review] AI review failed:", error);
    return Response.json({ status: "error", reason: "ai_unavailable" });
  }
}
