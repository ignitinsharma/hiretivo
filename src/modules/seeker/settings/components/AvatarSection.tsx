"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { compressImage } from "@/lib/image-compression";
import { uploadService } from "@/services/upload.service";

interface AvatarSectionProps {
  name: string | null | undefined;
  image: string | null | undefined;
  verified?: boolean;
}

export function AvatarSection({
  name,
  image,
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
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900">Avatar</h3>
        <p className="text-sm text-slate-500">
          Add a profile image for your Hiretivo profile.
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 p-6">
        <div className="relative h-24 w-24">
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
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => void onUpload(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="primary"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload avatar"}
        </Button>
      </div>
    </section>
  );
}
