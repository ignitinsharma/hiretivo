"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { compressImage } from "@/lib/image-compression";
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

  // Sync local state when logo prop changes; add cache-buster so browser refetches after upload
  useEffect(() => {
    if (!logo) { setCurrentLogo(null); return; }
    setCurrentLogo(logo.includes('?') ? `${logo}&v=${Date.now()}` : `${logo}?v=${Date.now()}`);
  }, [logo]);

  const onUpload = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      const result = await uploadService.uploadCompanyLogo(compressed);
      setCurrentLogo(
        `/api/logo?key=${encodeURIComponent(result.key)}&v=${Date.now()}`,
      );
      await queryClient.invalidateQueries({ queryKey: ["recruiter-settings"] });
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
