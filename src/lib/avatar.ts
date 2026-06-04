export interface AvatarSeedInput {
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  companyName?: string | null;
  fallbackSeed?: string | null;
}

const DICEBEAR_BASE_URL = "https://api.dicebear.com/9.x/notionists/svg";
const DICEBEAR_BACKGROUND = "e8e5ff";

function firstPresent(values: Array<string | null | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }

  return "hiretivo-avatar";
}

function hashSeed(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function getAvatarSeed(input: AvatarSeedInput): string {
  const seedSource = firstPresent([
    input.userId,
    input.email,
    input.name,
    input.companyName,
    input.fallbackSeed,
  ]);

  return hashSeed(seedSource.toLowerCase());
}

export function getDiceBearAvatarUrl(input: AvatarSeedInput): string {
  const seed = getAvatarSeed(input);
  const params = new URLSearchParams({
    seed,
    backgroundColor: DICEBEAR_BACKGROUND,
  });

  return `${DICEBEAR_BASE_URL}?${params.toString()}`;
}

export function getAvatarImageUrl(image: string | null | undefined): string | null {
  if (!image) return null;

  if (image.startsWith("data:")) return image;
  if (image.startsWith("blob:")) return image;
  if (image.startsWith("/")) return image;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `/api/logo?key=${encodeURIComponent(image)}`;
}
