import { type ComponentType, type SVGProps } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { CandidateApplication } from "../types";
import { getInitials } from "../utils";

interface DrawerHeaderLink {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface DrawerHeaderProps {
  application: CandidateApplication;
  links: DrawerHeaderLink[];
}

export function DrawerHeader({ application, links }: DrawerHeaderProps) {
  const profile = application.candidateProfile;

  return (
    <article className="rounded-xl border border-brand-border bg-white p-5">
      <div className="flex flex-col items-center text-center">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-brand-border bg-brand-surface">
          {application.candidateAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={application.candidateAvatar}
              alt={application.candidateName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-brand-foreground">
              {getInitials(application.candidateName)}
            </span>
          )}
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
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

        {links.length > 0 ? (
          <div className="mt-3 flex items-center justify-center gap-1">
            {links.map(({ href, label, Icon }) => (
              <Button key={label} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-brand-foreground-muted hover:text-brand-foreground" asChild>
                <a href={href} target="_blank" rel="noreferrer" title={label}>
                  <Icon className="h-4 w-4" />
                </a>
              </Button>
            ))}
          </div>
        ) : null}

      </div>
    </article>
  );
}

export type { DrawerHeaderLink };

