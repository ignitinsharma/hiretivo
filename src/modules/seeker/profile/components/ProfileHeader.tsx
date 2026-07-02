import Image from "next/image";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileHeaderProps {
  name?: string;
  headline?: string;
  image?: string | null;
  completeness: number;
  verified: boolean;
}

/*
 * ProfileHeader
 * Profile page header: avatar, name, headline, completeness ring, verified
 * pill, and an "Edit profile" link into settings.
 * @param props - ProfileHeaderProps
 */
export function ProfileHeader({
  name,
  headline,
  image,
  completeness,
  verified,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-brand-border bg-white p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-surface">
          {image ? (
            <Image src={image} alt={name ?? "Profile photo"} fill sizes="64px" className="object-cover" />
          ) : (
            <User className="h-7 w-7 text-brand-foreground-secondary" aria-hidden="true" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-brand-foreground">{name || "Your profile"}</h1>
            {verified && (
              <span className="rounded-lg bg-brand-success/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-success">
                Verified
              </span>
            )}
          </div>
          {headline && <p className="text-sm text-brand-foreground-muted">{headline}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 md:justify-end">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-brand-primary text-sm font-semibold text-brand-primary"
            role="progressbar"
            aria-valuenow={completeness}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {completeness}%
          </div>
          <p className="text-xs text-brand-foreground-muted">Profile complete</p>
        </div>
        <Button variant="primary" size="sm" asChild>
          <a href="/seeker/settings">Edit profile</a>
        </Button>
      </div>
    </div>
  );
}
