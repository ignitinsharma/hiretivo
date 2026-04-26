'use client';

import { Bookmark, ExternalLink, Mail, MapPin } from 'lucide-react';

import { InitialsAvatar } from '@/components/shared/InitialsAvatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useFetchTalentDetail,
  useToggleTalentShortlist,
} from '@/modules/recruiter/talent/queries/use-fetch-talent';

interface TalentProfileDialogProps {
  seekerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TalentProfileDialog({
  seekerId,
  open,
  onOpenChange,
}: TalentProfileDialogProps) {
  const { data: talent, isLoading } = useFetchTalentDetail(open ? seekerId : null);
  const shortlistMutation = useToggleTalentShortlist();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        {isLoading || !talent ? (
          <div className="py-12 text-center text-sm font-semibold text-[#454745]">
            Loading profile...
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4">
                <InitialsAvatar
                  name={talent.name}
                  image={talent.image}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-[26px] font-semibold leading-[1.23] tracking-[-0.39px] text-[#0e0f0c] [font-feature-settings:'calt']">
                    {talent.name ?? 'Unnamed talent'}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-[14px] font-semibold leading-[1.5] text-[#454745] [font-feature-settings:'calt']">
                    {talent.headline ?? talent.primaryRole ?? 'Candidate profile'}
                  </DialogDescription>
                  {talent.location && (
                    <p className="mt-2 flex items-center gap-1 text-sm font-semibold text-[#868685]">
                      <MapPin className="h-4 w-4" />
                      {talent.location}
                    </p>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill) => (
                  <span
                    key={`${skill.name}-${skill.level}`}
                    className="rounded-full bg-[rgba(89,82,229,0.1)] px-3 py-1 text-sm font-semibold text-[#5952e5]"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>

              <div className="grid gap-3 rounded-2xl border border-[rgba(14,15,12,0.12)] p-4 sm:grid-cols-2">
                <p className="text-sm font-semibold text-[#454745]">
                  Email: <span className="text-[#0e0f0c]">{talent.email ?? 'Unavailable'}</span>
                </p>
                <p className="text-sm font-semibold text-[#454745]">
                  Resume: <span className="text-[#0e0f0c]">{talent.resumeKey ? 'Available' : 'Not uploaded'}</span>
                </p>
                <p className="text-sm font-semibold text-[#454745]">
                  Experience: <span className="text-[#0e0f0c]">{talent.yearsExperience ?? 0} years</span>
                </p>
                <p className="text-sm font-semibold text-[#454745]">
                  Availability: <span className="text-[#0e0f0c]">{talent.availability ?? 'Not specified'}</span>
                </p>
              </div>

              {talent.bio && (
                <p className="text-[18px] font-normal leading-[1.44] tracking-[0.18px] text-[#454745] [font-feature-settings:'calt']">
                  {talent.bio}
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={() =>
                    shortlistMutation.mutate({
                      seekerId: talent.id,
                      isShortlisted: talent.isShortlisted,
                    })
                  }
                  className="rounded-full bg-[rgba(89,82,229,0.08)] text-[#0e0f0c] transition-transform hover:scale-105 active:scale-95"
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  {talent.isShortlisted ? 'Remove shortlist' : 'Shortlist'}
                </Button>
                {talent.email && (
                  <Button
                    asChild
                    className="rounded-full bg-[#5952e5] text-white transition-transform hover:scale-105 active:scale-95"
                  >
                    <a href={`mailto:${talent.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Mail talent
                    </a>
                  </Button>
                )}
                {talent.resumeKey && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full transition-transform hover:scale-105 active:scale-95"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Resume available
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
