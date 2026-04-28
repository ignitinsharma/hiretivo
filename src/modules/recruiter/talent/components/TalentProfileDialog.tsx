"use client";

import { ExternalLink, Mail, MapPin } from "lucide-react";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFetchTalentDetail } from "@/modules/recruiter/talent/queries/use-fetch-talent";

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
  const { data: talent, isLoading } = useFetchTalentDetail(
    open ? seekerId : null,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-xl sm:max-w-2xl">
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
                  <DialogTitle className="text-[26px] font-semibold leading-[1.23] tracking-[-0.39px] text-foreground ">
                    {talent.name ?? "Unnamed talent"}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-[14px] font-semibold leading-[1.5] text-[#454745] ">
                    {talent.headline ??
                      talent.primaryRole ??
                      "Candidate profile"}
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
                    className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-black"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>

              <div className="grid gap-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
                <p className="text-sm font-semibold text-[#454745]">
                  Email:{" "}
                  <span className="text-foreground">
                    {talent.email ?? "Unavailable"}
                  </span>
                </p>
                <p className="text-sm font-semibold text-[#454745]">
                  Resume:{" "}
                  <span className="text-foreground">
                    {talent.resumeKey ? "Available" : "Not uploaded"}
                  </span>
                </p>
                <p className="text-sm font-semibold text-[#454745]">
                  Experience:{" "}
                  <span className="text-foreground">
                    {talent.yearsExperience ?? 0} years
                  </span>
                </p>
                <p className="text-sm font-semibold text-[#454745]">
                  Availability:{" "}
                  <span className="text-foreground">
                    {talent.availability ?? "Not specified"}
                  </span>
                </p>
              </div>

              {talent.bio && (
                <p className="text-[18px] font-normal leading-[1.44] tracking-[0.18px] text-[#454745] ">
                  {talent.bio}
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                {talent.email && (
                  <Button asChild variant="primary">
                    <a href={`mailto:${talent.email}`}>
                      <Mail className="mr-2 h-4 w-4" />
                      Mail talent
                    </a>
                  </Button>
                )}
                {talent.resumeKey && (
                  <Button
                    type="button"
                    variant="default"
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
