"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { InitialsAvatar } from "@/components/shared/InitialsAvatar";
import { Button } from "@/components/ui/button";
import { uploadService } from "@/services/upload.service";

interface AvatarSectionProps {
  name: string | null | undefined;
  image: string | null | undefined;
}

export function AvatarSection({ name, image }: AvatarSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null | undefined>(image);

  const onUpload = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setIsUploading(true);
    try {
      const result = await uploadService.uploadAvatar(file);
      setCurrentImage(`/api/logo?key=${encodeURIComponent(result.key)}`);
      toast.success("Avatar uploaded successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-900">Avatar</h3>
        <p className="text-sm text-slate-500">
          Add a profile image or use initials fallback across Hiretivo.
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 p-6">
        <InitialsAvatar name={name} image={currentImage} size="xl" />
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => void onUpload(event.target.files?.[0])}
        />
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-full bg-[#5952e5] text-white transition-transform hover:scale-105 active:scale-95"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload avatar"}
        </Button>
      </div>
    </section>
  );
}
