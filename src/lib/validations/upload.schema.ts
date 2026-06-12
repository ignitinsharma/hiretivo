export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const AVATAR_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

// SVG is intentionally excluded: it can carry inline scripts (stored-XSS risk)
// and cannot be validated by magic bytes. Raster formats only.
export const LOGO_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export const RESUME_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
