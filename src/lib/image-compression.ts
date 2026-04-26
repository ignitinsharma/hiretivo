import { AVATAR_MAX_BYTES } from "@/lib/validations/upload.schema";

const MAX_DIMENSION = 800;
const TARGET_QUALITY = 0.8;

/**
 * Compresses an image file client-side using Canvas API.
 * - Converts to WebP format
 * - Resizes if either dimension exceeds MAX_DIMENSION (800px)
 * - Reduces quality until under AVATAR_MAX_BYTES (2MB)
 *
 * Returns the original file if already under limit and small enough.
 */
export async function compressImage(file: File): Promise<File> {
  // Already small enough and not huge dimensions — skip compression
  if (file.size <= AVATAR_MAX_BYTES) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);

      // Calculate resized dimensions
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Progressive quality reduction until under limit
      let quality = TARGET_QUALITY;
      const tryCompress = (): void => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            if (blob.size <= AVATAR_MAX_BYTES || quality <= 0.1) {
              const compressed = new File([blob], file.name, {
                type: "image/webp",
              });
              resolve(compressed);
            } else {
              quality -= 0.15;
              tryCompress();
            }
          },
          "image/webp",
          quality,
        );
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error("Failed to load image for compression"));
    img.src = URL.createObjectURL(file);
  });
}
