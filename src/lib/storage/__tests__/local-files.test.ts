import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, it } from "node:test";
import { deleteLocalFile, readLocalFile, writeLocalFile } from "../local-files";

let volume: string;

before(async () => {
  volume = await mkdtemp(join(tmpdir(), "hiretivo-files-"));
  process.env.HIRETIVO_FILES_DIR = volume;
});

after(async () => {
  delete process.env.HIRETIVO_FILES_DIR;
  await rm(volume, { recursive: true, force: true });
});

it("retains uploaded bytes at a stable volume path and deletes them on request", async () => {
  const key = "resumes/owner/resume.pdf";
  const bytes = Buffer.from("%PDF-1.7 local resume");
  await writeLocalFile(key, bytes);
  assert.deepEqual(await readLocalFile(key), bytes);
  assert.deepEqual(await readFile(join(volume, key)), bytes);
  await deleteLocalFile(key);
  await assert.rejects(readLocalFile(key), { code: "ENOENT" });
});

it("rejects traversal and absolute paths", async () => {
  for (const key of ["../secret", "resumes/../../secret", "/etc/passwd", "resumes//resume.pdf"]) {
    await assert.rejects(writeLocalFile(key, Buffer.from("private")), /Invalid file key/);
  }
});
