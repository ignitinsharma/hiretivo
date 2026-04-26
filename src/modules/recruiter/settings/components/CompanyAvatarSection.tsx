"use client";

import { Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { Button } from "@/components/ui/button";
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(logo);
  const target = "companyLogo";

  // Sync local state when the logo prop changes (e.g., after API loads on mount)
  useEffect(() => {
    setCurrentLogo(logo);
  }, [logo]);

  const onUpload = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      const result = await uploadService.uploadCompanyLogo(compressed);
      setCurrentLogo(`/api/logo?key=${encodeURIComponent(result.key)}`);
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
    <section className="rounded-2xl border border-[rgba(14,15,12,0.12)] bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <InitialsAvatar
            companyName={companyName}
            image={currentLogo}
            size="xl"
          />
          <div>
            <h3 className="text-[22px] font-semibold leading-[1.25] tracking-[-0.396px] text-[#0e0f0c] [font-feature-settings:'calt']">
              Company logo
            </h3>
            <p className="text-sm font-semibold text-[#454745]">
              Upload target: {target}
            </p>
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
