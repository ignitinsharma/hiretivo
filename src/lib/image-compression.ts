import { AVATAR_MAX_BYTES } from "@/lib/validations/upload.schema";

const MAX_DIMENSION = 512;
const TARGET_QUALITY = 0.8;

/**
 * Normalizes an image for display, client-side via Canvas API.
 * - ALWAYS runs for raster images (png/jpeg/webp), regardless of input byte size:
 *   a small-but-high-resolution file still gets shrunk, so avatars/logos rendered
 *   at <=128px never ship megabytes over the wire on every view.
 * - Resizes longest edge to MAX_DIMENSION (512px) and re-encodes to WebP.
 * - Steps quality down until under AVATAR_MAX_BYTES (at 512px, passes first try).
 *
 * SVG is returned untouched — it is vector (already tiny, infinitely scalable);
 * rasterizing it would destroy scalability and can inflate size.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/svg+xml") {
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
              // Match the filename to the encoding (bytes are now WebP).
              const name = file.name.replace(/\.[^./\\]+$/, "") + ".webp";
              const compressed = new File([blob], name, {
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
