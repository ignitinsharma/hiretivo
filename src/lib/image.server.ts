import sharp from "sharp";

const AVATAR_MAX_DIMENSION = 800;
const LOGO_MAX_DIMENSION = 800;
const QUALITY = 85;
const SKIP_THRESHOLD_BYTES = 300_000;

export interface CompressionResult {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Server-side image compression using sharp.
 * - Converts PNG/JPEG to WebP
 * - Resizes to max dimension (800px) while maintaining aspect ratio
 * - Quality 85 (balances size vs quality)
 * - Skips SVG (vector, can't rasterize)
 * - Skips images already under threshold (small file + small dims == already optimal)
 *
 * Throws on corrupt/unreadable images.
 */
export async function compressImageOnServer(
  buffer: Buffer,
  mimeType: string,
): Promise<CompressionResult> {
  if (mimeType === "image/svg+xml") {
    return { buffer, mimeType };
  }

  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  const maxDim = mimeType === "image/webp" || mimeType === "image/png"
    ? AVATAR_MAX_DIMENSION
    : LOGO_MAX_DIMENSION;

  if (
    width <= maxDim &&
    height <= maxDim &&
    buffer.length <= SKIP_THRESHOLD_BYTES
  ) {
    return { buffer, mimeType };
  }

  const resized = await sharp(buffer)
    .resize(maxDim, maxDim, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();

  return { buffer: resized, mimeType: "image/webp" };
}
