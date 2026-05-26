import { Code2, ExternalLink } from "lucide-react";
import Link from "next/link";

import { normalizeCodingProfiles } from "@/lib/verification/coding-profiles";

interface SeekerCodingProfilesCardProps {
  codingProfiles: unknown;
}

export function SeekerCodingProfilesCard({
  codingProfiles,
}: SeekerCodingProfilesCardProps) {
  const profiles = normalizeCodingProfiles(codingProfiles);

  return (
    <section className="rounded-xl border border-brand-border bg-white p-5">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold leading-snug tracking-tight text-brand-foreground">
        <Code2 className="h-4 w-4 text-brand-primary" aria-hidden="true" />
        Coding Profiles
      </h3>

      {profiles.length === 0 ? (
        <p className="text-sm text-brand-foreground-muted">
          No optional coding profiles provided.
        </p>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <div
              key={`${profile.platform}-${profile.profileUrl}`}
              className="rounded-xl border border-brand-border bg-brand-surface p-3"
            >
              <Link
                href={profile.profileUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline"
              >
                {profile.platform}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
              {profile.handle ? (
                <p className="mt-1 text-xs text-brand-foreground-muted">
                  @{profile.handle}
                </p>
              ) : null}
              {profile.evidenceSummary ? (
                <p className="mt-2 text-xs leading-relaxed text-brand-foreground-muted">
                  {profile.evidenceSummary}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
