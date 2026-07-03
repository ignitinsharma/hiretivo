import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/*
 * getEncryptionKey
 * Loads the AES-256 key from FIELD_ENCRYPTION_KEY (base64, 32 raw bytes).
 * Only called when a PII field is actually being encrypted/decrypted, so
 * routes that never touch self-ID data don't require the env var.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.FIELD_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("FIELD_ENCRYPTION_KEY is not set");
  }
  const buffer = Buffer.from(key, "base64");
  if (buffer.length !== 32) {
    throw new Error("FIELD_ENCRYPTION_KEY must decode to 32 bytes");
  }
  return buffer;
}

/*
 * encryptField
 * Encrypts a plaintext string with AES-256-GCM for at-rest storage of
 * voluntary US-EEO self-ID fields (spec §7 gap 5).
 * @param plaintext - raw value to encrypt
 * @returns base64 string: iv (12B) + auth tag (16B) + ciphertext
 */
export function encryptField(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

/*
 * decryptField
 * Decrypts a value produced by encryptField().
 * @param encoded - base64 string: iv (12B) + auth tag (16B) + ciphertext
 * @returns the original plaintext
 */
export function decryptField(encoded: string): string {
  const raw = Buffer.from(encoded, "base64");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
