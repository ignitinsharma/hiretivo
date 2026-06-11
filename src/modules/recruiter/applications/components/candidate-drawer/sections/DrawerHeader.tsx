"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { ProfileLinks } from "@/components/shared/ProfileLinks";
import { ProfileLinkVariant, VerificationStatus } from "@/constants/enums";

import type { CandidateApplication } from "../types";

interface DrawerHeaderProps {
  application: CandidateApplication;
  resumeUrl: string | null;
}

/*
 * DrawerHeader
 * Centered candidate identity header for the applications drawer.
 * Renders avatar, name, headline, and the shared ProfileLinks icon row.
 * @param application - the candidate application record
 * @param resumeUrl - resolved resume URL (null when none)
 */
export function DrawerHeader({ application, resumeUrl }: DrawerHeaderProps) {
  const profile = application.candidateProfile;

  /* Copies the candidate email to clipboard and blurs the button to dismiss focus. */
  const copyEmail = async (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      await navigator.clipboard.writeText(application.candidateEmail);
      toast.success("Email copied.");
    } catch {
      toast.error("Could not copy email.");
    }
    e.currentTarget.blur();
  };

  return (
    <article className="rounded-xl border border-brand-border bg-white p-5">
      <div className="flex flex-col items-center text-center">
        <InitialsAvatar
          name={application.candidateName}
          email={application.candidateEmail}
          image={application.candidateAvatar}
          size="xl"
          verified={
            application.verificationStatus === VerificationStatus.VERIFIED
          }
          className="h-20 w-20"
        />

        <h2 className="capitalize mt-4 text-xl font-bold leading-tight tracking-tight text-brand-foreground">
          {application.candidateName}
        </h2>

        <div className="group flex items-center justify-center gap-1">
          <button
            onClick={copyEmail}
            className="opacity-0 transition-opacity group-hover:opacity-100"
            title="Copy email"
          >
            <Copy className="h-3.5 w-3.5 text-brand-foreground-secondary" />
          </button>
        </div>

        {profile?.headline ? (
          <p className="text-xs font-medium text-brand-primary">
            {profile.headline}
          </p>
        ) : null}

        <ProfileLinks
          className="mt-3 justify-center"
          variant={ProfileLinkVariant.GHOST}
          email={application.candidateEmail}
          resumeUrl={resumeUrl}
          websiteUrl={profile?.websiteUrl}
          linkedinUrl={profile?.linkedinUrl}
          githubUrl={profile?.githubUrl}
          twitterUrl={profile?.twitterUrl}
          videoIntroUrl={profile?.videoIntroUrl}
        />
      </div>
    </article>
  );
}
