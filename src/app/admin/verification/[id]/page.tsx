import Link from "next/link";
import { notFound } from "next/navigation";

import { VerificationStatus } from "@/constants/enums";
import { prisma } from "@/lib/prisma";
import { getVerificationReadiness } from "@/lib/verification/readiness";
import { SeekerBioCard } from "./SeekerBioCard";
import { SeekerCodingProfilesCard } from "./SeekerCodingProfilesCard";
import { SeekerGitHubCard } from "./SeekerGitHubCard";
import { SeekerProfileHero } from "./SeekerProfileHero";
import { SeekerProjectsCard } from "./SeekerProjectsCard";
import { SeekerReadinessCard } from "./SeekerReadinessCard";
import { SeekerSkillsCard } from "./SeekerSkillsCard";
import { SeekerWorkHistoryCard } from "./SeekerWorkHistoryCard";
import { VerificationReviewRightColumn } from "./VerificationReviewRightColumn";

export const revalidate = 0;

/*
 * AdminVerificationDetailPage
 * Full engineer profile review page for admin verification.
 * Layout: full-width profile hero, 2-column content bubble grid, then review form.
 * Content is split evenly between columns to avoid the old single-column scroll issue.
 */

interface AdminVerificationDetailPageProps {
  params: { id: string };
}

interface ProjectSummary {
  name?: string;
  description?: string;
  sourceUrl?: string;
  liveUrl?: string;
  url?: string;
}

function getProjectSummaries(value: unknown): ProjectSummary[] {
  if (!Array.isArray(value)) return [];

  return value.filter((project): project is ProjectSummary => {
    if (typeof project !== "object" || project === null) return false;
    const p = project as Record<string, unknown>;
    return (
      typeof p.name === "string" ||
      typeof p.description === "string" ||
      typeof p.sourceUrl === "string" ||
      typeof p.url === "string"
    );
  });
}

export default async function AdminVerificationDetailPage({
  params,
}: AdminVerificationDetailPageProps) {
  const engineer = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      timezone: true,
      createdAt: true,
      updatedAt: true,
      verificationStatus: true,
      hiretivoScore: true,
      reapplyAfter: true,
      timezoneOverlapHours: true,
      availableFrom: true,
      seekerProfile: {
        select: {
          headline: true,
          bio: true,
          primaryRole: true,
          location: true,
          yearsExperience: true,
          githubUsername: true,
          githubScore: true,
          githubAnalysis: true,
          githubScannedAt: true,
          githubUrl: true,
          codingProfiles: true,
          videoIntroUrl: true,
          topProjects: true,
          salaryMinUsd: true,
          salaryMaxUsd: true,
          skills: {
            select: {
              level: true,
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
            },
          },
        },
      },
      verificationReviews: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          scoreGiven: true,
          notes: true,
          createdAt: true,
          reviewedBy: true,
          aiSummary: true,
        },
      },
    },
  });

  if (!engineer) notFound();

  const alreadyInReview =
    engineer.verificationStatus === VerificationStatus.IN_REVIEW;

  const projects = getProjectSummaries(engineer.seekerProfile?.topProjects);
  const readiness = getVerificationReadiness(engineer);
  const canReview =
    engineer.verificationStatus === VerificationStatus.PENDING ||
    engineer.verificationStatus === VerificationStatus.IN_REVIEW;

  // Check if the latest review already has an aiSummary (re-opened case)
  const latestReview = engineer.verificationReviews[0] ?? null;
  const existingAiSummary = latestReview?.aiSummary as {
    model: string;
    promptVersion: string;
    inputSnapshot: object;
    output: {
      recommendation: "APPROVE" | "REJECT";
      confidence: number;
      scoreSuggestion: number;
      reasons: string[];
      summary: string;
    };
    overrideReason?: string;
  } | null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Back link */}
      <Link
        href="/admin/verification"
        className="text-sm font-medium text-brand-primary hover:underline"
      >
        &larr; Back to queue
      </Link>

      {/* In-review warning */}
      {alreadyInReview && (
        <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Another admin may already have this submission open.
        </div>
      )}

      {/* Profile Hero — full width */}
      <div className="mt-6">
        <SeekerProfileHero
          name={engineer.name}
          email={engineer.email}
          headline={engineer.seekerProfile?.headline ?? null}
          primaryRole={engineer.seekerProfile?.primaryRole ?? null}
          location={engineer.seekerProfile?.location ?? null}
          yearsExperience={engineer.seekerProfile?.yearsExperience ?? null}
          timezoneOverlapHours={engineer.timezoneOverlapHours ?? null}
          salaryMinUsd={engineer.seekerProfile?.salaryMinUsd ?? null}
          salaryMaxUsd={engineer.seekerProfile?.salaryMaxUsd ?? null}
          availableFrom={engineer.availableFrom ?? null}
          githubUsername={engineer.seekerProfile?.githubUsername ?? null}
          videoIntroUrl={engineer.seekerProfile?.videoIntroUrl ?? null}
          verificationStatus={engineer.verificationStatus}
        />
      </div>

      {/* Content bubbles — 2-column grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Left column: Bio, Work History, Readiness */}
        <div className="space-y-6">
          <SeekerBioCard bio={engineer.seekerProfile?.bio ?? null} />
          <SeekerWorkHistoryCard
            experiences={engineer.seekerProfile?.workExperiences ?? null}
          />
          <SeekerReadinessCard
            completedFields={readiness.completedFields}
            missingFields={readiness.missingFields}
            totalFields={
              readiness.completedFields.length + readiness.missingFields.length
            }
          />
        </div>

        {/* Right column: Skills, Projects, GitHub Analysis */}
        <div className="space-y-6">
          <SeekerSkillsCard skills={engineer.seekerProfile?.skills ?? null} />
          <SeekerProjectsCard projects={projects} />
          <SeekerGitHubCard
            username={engineer.seekerProfile?.githubUsername ?? null}
            score={engineer.seekerProfile?.githubScore ?? null}
            analysis={engineer.seekerProfile?.githubAnalysis ?? null}
            scannedAt={engineer.seekerProfile?.githubScannedAt ?? null}
          />
          <SeekerCodingProfilesCard
            codingProfiles={engineer.seekerProfile?.codingProfiles ?? null}
          />
        </div>
      </div>

      {/* Review section — below content for decision-making */}
      <div className="mt-8">
        <div className="mx-auto max-w-2xl">
          <VerificationReviewRightColumn
            engineerId={engineer.id}
            reviewId={latestReview?.id ?? ""}
            canReview={canReview}
            currentStatus={engineer.verificationStatus}
            existingAiSummary={existingAiSummary}
          />
        </div>
      </div>
    </main>
  );
}
