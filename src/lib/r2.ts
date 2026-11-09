import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SELF_HOSTED } from "@/lib/config";
import { deleteLocalFile, writeLocalFile } from "@/lib/storage/local-files";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

// ─── Folder key helpers ───────────────────────────────────────────────────────
// One bucket, organised by prefix. Call these to get the R2 key for any upload.
//
// Usage:
//   const key = R2_KEYS.resume(seekerId)
//   const { url } = await uploadFile(file, key)
//   // store `key` in DB (not the URL — URLs expire; keys don't)
//
export const R2_KEYS = {
  /** Seeker resume — always overwrites so no orphaned files */
  resume: (seekerId: string) => `resumes/${seekerId}/resume.pdf`,

  /** Seeker profile photo — unique per upload so cached avatars refresh reliably */
  avatar: (userId: string, uploadId: string) =>
    `avatars/${userId}/${uploadId}.webp`,

  /** Recruiter / company logo — safe to serve publicly */
  companyLogo: (recruiterId: string) =>
    `company-logos/${recruiterId}/logo.webp`,
} as const;

/* Keep local resume file type in its key while preserving hosted R2 keys. */
export function resumeUploadKey(userId: string, mimeType: string): string {
  if (!SELF_HOSTED) return R2_KEYS.resume(userId);
  const extension = mimeType === "application/pdf" ? "pdf"
    : mimeType === "application/msword" ? "doc" : "docx";
  return `resumes/${userId}/resume.${extension}`;
}

// ─── Signed URL helper (for private files e.g. resumes) ──────────────────────
// Call this whenever you need to render a resume in the browser.
// Returns a fresh signed URL (1 hour). Never store this URL — always regenerate.
//
export async function getSignedFileUrl(key: string): Promise<string> {
  if (key.startsWith("data:")) return key;
  if (SELF_HOSTED) {
    return key.startsWith("resumes/") ? "/api/upload/resume/file" : `/api/logo?key=${encodeURIComponent(key)}`;
  }
  const client = getR2Client();
  if (!client) return `/api/logo?key=${encodeURIComponent(key)}`;

  const bucket = requireEnv("R2_BUCKET_NAME");
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });

  type SigningClient = Parameters<typeof getSignedUrl>[0];
  return getSignedUrl(client as unknown as SigningClient, command, {
    expiresIn: 3600,
  });
}

// ─── Delete helper ────────────────────────────────────────────────────────────
// Use when a seeker deletes their account or explicitly removes their resume.
//
export async function deleteFile(key: string): Promise<void> {
  if (SELF_HOSTED) return deleteLocalFile(key);
  const client = getR2Client();
  if (!client) return;
  const bucket = requireEnv("R2_BUCKET_NAME");
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// ─── URL resolution helper ────────────────────────────────────────────────────
// Converts a stored R2 key or already-absolute URL to a renderable public URL.
// Handles backward-compat: old records stored keys, new records store full URLs.
export function resolveLogoUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith('data:')) return raw;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    // If it's the private R2 storage endpoint, extract the key and proxy it
    const privateBase = process.env.R2_PUBLIC_URL?.trim()?.replace(/\/$/, '');
    if (privateBase && raw.startsWith(privateBase)) {
      const key = raw.slice(privateBase.length + 1);
      return `/api/logo?key=${encodeURIComponent(key)}`;
    }
    // Other absolute URL (Google OAuth, public CDN) — use as-is
    return raw;
  }

  // Bare R2 key
  return `/api/logo?key=${encodeURIComponent(raw)}`;
}

// ─── Original uploadFile — unchanged ─────────────────────────────────────────

export interface UploadFileResult {
  url: string;
}

/**
 * Uploads a file to R2. Returns a public URL when `R2_PUBLIC_URL` is set,
 * otherwise a time-limited signed GET URL.
 *
 * Store the R2 *key* in your DB, not the URL.
 * URLs expire (signed) or may change (public base URL).
 * Keys are permanent and stable.
 */
export async function uploadFile(
  file: File,
  key: string
): Promise<UploadFileResult> {
  if (SELF_HOSTED) {
    await writeLocalFile(key, new Uint8Array(await file.arrayBuffer()));
    return { url: await getSignedFileUrl(key) };
  }
  const client = getR2Client();
  if (!client) {
    return { url: `/api/logo?key=${encodeURIComponent(key)}` };
  }

  const bucket = requireEnv("R2_BUCKET_NAME");
  const body = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  const putInput: PutObjectCommandInput = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  };

  await client.send(new PutObjectCommand(putInput));

  const publicBase = process.env.R2_PUBLIC_URL?.trim();
  if (publicBase) {
    const base = publicBase.replace(/\/$/, "");
    return { url: `${base}/${key}` };
  }

  const command = new GetObjectCommand({ Bucket: bucket, Key: key });

  type SigningClient = Parameters<typeof getSignedUrl>[0];
  const url = await getSignedUrl(
    client as unknown as SigningClient,
    command,
    { expiresIn: 3600 }
  );
  return { url };
}
