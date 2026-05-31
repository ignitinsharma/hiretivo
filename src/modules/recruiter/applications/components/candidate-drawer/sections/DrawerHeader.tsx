import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { getAvatarUrl } from "@/lib/avatar";

import type { CandidateApplication } from "../types";

interface DrawerHeaderProps {
  application: CandidateApplication;
}

export function DrawerHeader({ application }: DrawerHeaderProps) {
  const profile = application.candidateProfile;

  return (
    <article className="rounded-xl border border-brand-border bg-white p-5">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <InitialsAvatar
            image={getAvatarUrl(application.candidateAvatar)}
            name={application.candidateName}
            email={application.candidateEmail}
            size="lg"
            className="border border-brand-border"
          />
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>

        <h2 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-brand-foreground">
          {application.candidateName}
        </h2>
        <p className="mt-1 text-sm text-brand-foreground-muted">{application.candidateEmail}</p>
        {profile?.headline ? (
          <p className="mt-1 text-xs font-medium text-brand-primary">{profile.headline}</p>
        ) : null}

        <Button size="sm" variant="primary" className="mt-4 w-full" asChild>
          <a href={`mailto:${application.candidateEmail}`}>
            <Mail className="h-3.5 w-3.5" />
            Email
          </a>
        </Button>

      </div>
    </article>
  );
}
