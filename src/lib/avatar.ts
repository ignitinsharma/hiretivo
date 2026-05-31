/*
 * getAvatarUrl
 * Resolves a user image value to a displayable URL.
 * R2 object keys (non-http strings) → /api/logo?key=..., HTTP URLs passed through.
 * Returns null if image is empty.
 */
export function getAvatarUrl(image: string | null | undefined): string | null {
  if (!image) return null;
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  return `/api/logo?key=${encodeURIComponent(image)}`;
}

/*
 * getDiceBearUrl
 * Returns a DiceBear v9 notionists SVG avatar URL for the given seed.
 * Used as the default fallback when no profile photo is uploaded.
 */
export function getDiceBearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=e8e5ff`;
}
