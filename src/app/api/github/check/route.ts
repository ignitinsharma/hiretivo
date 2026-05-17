import { NextRequest } from "next/server";

/*
 * POST /api/github/check
 * Lightweight GitHub profile check — verifies a GitHub URL exists and counts
 * public repos. Used by the seeker verification flow (StepGitHub) to validate
 * the user's GitHub profile before submission. No AI analysis, no DB mutations.
 * Body: { githubUrl: string }
 * Returns: { status: "success" | "private" | "not_found" | "error", publicRepoCount: number }
 */

export async function POST(req: NextRequest) {
  let body: { githubUrl?: string };
  try {
    body = (await req.json()) as { githubUrl?: string };
  } catch {
    return Response.json(
      { status: "error", publicRepoCount: 0 },
      { status: 400 },
    );
  }

  const rawUrl = body.githubUrl?.trim().replace(/\/$/, "");
  if (!rawUrl || !/^https:\/\/github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(rawUrl)) {
    return Response.json(
      { status: "error", publicRepoCount: 0 },
      { status: 400 },
    );
  }

  // Extract username from URL
  const username = rawUrl.replace("https://github.com/", "");

  const token = process.env.GITHUB_TOKEN;
  const authHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) {
    authHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers: authHeaders }),
      fetch(
        `https://api.github.com/users/${username}/repos?sort=pushed&per_page=30&type=public`,
        { headers: authHeaders },
      ),
    ]);

    if (userRes.status === 404) {
      return Response.json({ status: "not_found", publicRepoCount: 0 });
    }

    if (!userRes.ok || !reposRes.ok) {
      return Response.json({ status: "error", publicRepoCount: 0 });
    }

    const reposData = (await reposRes.json()) as Array<{
      private: boolean;
    }>;

    const publicRepoCount = reposData.filter((r) => !r.private).length;

    return Response.json({
      status: publicRepoCount > 0 ? "success" : "private",
      publicRepoCount,
    });
  } catch {
    return Response.json({ status: "error", publicRepoCount: 0 });
  }
}
