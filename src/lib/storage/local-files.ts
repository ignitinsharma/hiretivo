import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

/* Resolve a storage key beneath the configured volume, rejecting traversal. */
function filePath(key: string): string {
  if (!key || key.split("/").some((part) => !/^[A-Za-z0-9._-]+$/.test(part) || part === "." || part === "..")) {
    throw new Error("Invalid file key");
  }
  const root = resolve(process.env.HIRETIVO_FILES_DIR ?? join(process.cwd(), "data", "files"));
  const path = resolve(root, key);
  if (!path.startsWith(`${root}${sep}`)) throw new Error("Invalid file key");
  return path;
}

/* Write a private file to the persistent local volume. */
export async function writeLocalFile(key: string, bytes: Uint8Array): Promise<void> {
  const path = filePath(key);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await writeFile(path, bytes, { mode: 0o600 });
}

/* Read a private file after its caller has checked ownership. */
export async function readLocalFile(key: string): Promise<Buffer> {
  return readFile(filePath(key));
}

/* Delete a private file when its owner removes it. */
export async function deleteLocalFile(key: string): Promise<void> {
  await unlink(filePath(key)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
