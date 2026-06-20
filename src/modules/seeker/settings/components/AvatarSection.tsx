"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { compressImage } from "@/lib/image-compression";
import { uploadService } from "@/services/upload.service";
import type { ProfileStrengthSummary } from "@/modules/seeker/dashboard/types/dashboard.types";

interface AvatarSectionProps {
  name: string | null | undefined;
  image: string | null | undefined;
  headline?: string | null;
  primaryRole?: string | null;
  profileStrength?: ProfileStrengthSummary;
  verified?: boolean;
}

/*
 * AvatarSection
 * Profile summary card with avatar upload, role line, and profile completion status.
 */
export function AvatarSection({
  name,
  image,
  headline,
  primaryRole,
  profileStrength,
  verified = false,
}: AvatarSectionProps) {
  const queryClient = useQueryClient();
  const { data: session, update } = useSession();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null | undefined>(
    image,
  );

  // Sync local state when the image prop changes (e.g., after API loads on mount)
  useEffect(() => {
    setCurrentImage(image);
  }, [image]);

  const displayName = name?.trim() || "Your profile";
  const roleLabel =
    headline?.trim() || primaryRole?.trim() || "Add a professional headline";
  const completionPercentage = profileStrength?.percentage ?? 0;

  const onUpload = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      const result = await uploadService.uploadAvatar(compressed);
      setCurrentImage(
        `/api/logo?key=${encodeURIComponent(result.key)}&v=${Date.now()}`,
      );
      await update({ user: { image: result.key } });
      await queryClient.invalidateQueries({ queryKey: ["seeker-settings"] });
      toast.success("Avatar uploaded successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-brand-border bg-white">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0">
            <InitialsAvatar
              name={name}
              image={currentImage}
              userId={session?.user?.id}
              email={session?.user?.email}
              size="xl"
              verified={verified}
            />
            {isUploading ? (
              <Skeleton className="absolute inset-0 rounded-full bg-muted/80" />
            ) : null}
          </div>

          <div className="min-w-0 space-y-3">
            <div>
              <h3 className="text-xl font-bold text-brand-foreground">
                {displayName}
              </h3>
              <p className="mt-1 text-base font-medium text-brand-foreground-muted">
                {roleLabel}
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-lg bg-brand-success/10 px-3 py-1.5 text-sm font-bold text-brand-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Profile {completionPercentage}% complete
            </span>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => void onUpload(event.target.files?.[0])}
        />
        <div className="flex flex-col items-start gap-2 md:items-end">
          <Button
            type="button"
            variant="primary"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload avatar"}
          </Button>
          <p className="text-sm font-medium text-brand-foreground-muted">
            JPG, PNG or WebP. Max 2MB
          </p>
        </div>
      </div>
    </section>
  );
}
