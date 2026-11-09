import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/* Read the installation's 256-bit encryption key only on the server. */
function encryptionKey(): Buffer {
  const value = process.env.HIRETIVO_ENCRYPTION_KEY;
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error("HIRETIVO_ENCRYPTION_KEY must be a 32-byte hex secret");
  }
  return Buffer.from(value, "hex");
}

/* Encrypt a provider credential with a fresh nonce and authenticated tag. */
export function encryptProviderSecret(secret: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), nonce);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return ["v1", nonce.toString("base64url"), cipher.getAuthTag().toString("base64url"), ciphertext.toString("base64url")].join(".");
}

/* Decrypt only inside server AI calls; malformed or modified values fail closed. */
export function decryptProviderSecret(value: string): string {
  const [version, nonceText, tagText, ciphertextText, extra] = value.split(".");
  if (version !== "v1" || !nonceText || !tagText || !ciphertextText || extra) throw new Error("Invalid encrypted credential");
  const nonce = Buffer.from(nonceText, "base64url");
  const tag = Buffer.from(tagText, "base64url");
  if (nonce.length !== 12 || tag.length !== 16) throw new Error("Invalid encrypted credential");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(Buffer.from(ciphertextText, "base64url")), decipher.final()]).toString("utf8");
}
