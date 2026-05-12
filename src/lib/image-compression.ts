import { AVATAR_MAX_BYTES } from "@/lib/validations/upload.schema";

const MAX_DIMENSION = 800;
const TARGET_QUALITY = 0.8;
const SKIP_THRESHOLD_BYTES = 200_000;

/**
 * Compresses an image file client-side using Canvas API.
 * - Converts to WebP format
 * - Resizes if either dimension exceeds MAX_DIMENSION (800px)
 * - Reduces quality until under AVATAR_MAX_BYTES (2MB)
 * - Skips SVG files (Canvas cannot render them)
 *
 * Returns the original file if already small enough in both dimensions and size.
 */
export async function compressImage(file: File): Promise<File> {
  // SVG files cannot be rendered on Canvas — return as-is
  if (file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);

      const { width, height } = img;

      // Skip compression if already small enough
      if (width <= MAX_DIMENSION && height <= MAX_DIMENSION && file.size <= SKIP_THRESHOLD_BYTES) {
        resolve(file);
        return;
      }

      // Calculate resized dimensions
      let w = width;
      let h = height;
      if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);

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
