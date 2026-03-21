import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function getR2Client(): S3Client {
  const accountId = requireEnv("R2_ACCOUNT_ID");
  const accessKeyId = requireEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("R2_SECRET_ACCESS_KEY");

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

  /** Seeker profile photo */
  avatar: (userId: string) => `avatars/${userId}/avatar.webp`,

  /** Recruiter / company logo — safe to serve publicly */
  companyLogo: (recruiterId: string) =>
    `company-logos/${recruiterId}/logo.webp`,
} as const;

// ─── Signed URL helper (for private files e.g. resumes) ──────────────────────
// Call this whenever you need to render a resume in the browser.
// Returns a fresh signed URL (1 hour). Never store this URL — always regenerate.
//
export async function getSignedFileUrl(key: string): Promise<string> {
  const bucket = requireEnv("R2_BUCKET_NAME");
  const client = getR2Client();

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
  const bucket = requireEnv("R2_BUCKET_NAME");
  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
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
  const bucket = requireEnv("R2_BUCKET_NAME");
  const client = getR2Client();

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