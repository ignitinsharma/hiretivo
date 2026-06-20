"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { compressImage } from "@/lib/image-compression";
import type { RecruiterSettingsData } from "@/services/recruiter.service";
import { uploadService } from "@/services/upload.service";

interface CompanyAvatarSectionProps {
  companyName: string;
  logo: string | null;
}

export function CompanyAvatarSection({
  companyName,
  logo,
}: CompanyAvatarSectionProps) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(logo);
  const displayCompanyName = companyName.trim() || "Company";

  /* Sync local display when the logo prop changes from the parent (e.g. initial
   * load or external update). Skip re-busting if the URL already has a ?v= param
   * (set by onUpload) to avoid double-appending cache-buster tokens. */
  useEffect(() => {
    if (!logo) { setCurrentLogo(null); return; }
    if (logo.includes('v=')) { setCurrentLogo(logo); return; }
    setCurrentLogo(logo.includes('?') ? `${logo}&v=${Date.now()}` : `${logo}?v=${Date.now()}`);
  }, [logo]);

  const onUpload = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      const result = await uploadService.uploadCompanyLogo(compressed);
      /* Cache-bust the URL so the browser does not serve the stale R2 image.
       * The R2 key is deterministic (same path on every upload), so the browser
       * would otherwise hit its HTTP cache (max-age=3600 on /api/logo). */
      const freshLogoUrl = `/api/logo?key=${encodeURIComponent(result.key)}&v=${Date.now()}`;
      setCurrentLogo(freshLogoUrl);
      /* Patch the shared query cache directly so RecruiterHeader (which reads
       * the same ['recruiter-settings'] key) picks up the new URL immediately
       * without an extra round-trip — and without getting back a URL that lacks
       * the cache buster. */
      queryClient.setQueryData<{ data: RecruiterSettingsData }>(
        ["recruiter-settings"],
        (old) =>
          old ? { ...old, data: { ...old.data, logo: freshLogoUrl } } : old,
      );
      toast.success("Company logo uploaded.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload logo.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="rounded-xl border border-brand-border bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24">
            <InitialsAvatar
              companyName={companyName}
              image={currentLogo}
              size="xl"
            />
            {isUploading ? (
              <Skeleton className="absolute inset-0 rounded-full bg-muted/80" />
            ) : null}
          </div>
          <div>
            <h3 className="text-[22px] font-semibold leading-[1.25] tracking-[-0.396px] text-foreground ">
              {displayCompanyName}
            </h3>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={(event) => void onUpload(event.target.files?.[0])}
        />
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          variant={"primary"}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload logo"}
        </Button>
      </div>
    </section>
  );
}
