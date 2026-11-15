import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import snapshot from "./schema.json";

const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");

describe("hosted tenant schema bundle", () => {
  it("is regenerated when the Prisma schema changes", () => {
    expect(snapshot.schemaHash, "Run node scripts/generate-tenant-schema.mjs").toBe(digest(readFileSync(path.join(process.cwd(), "prisma/schema.prisma"))));
    expect(snapshot.sql).not.toContain('CREATE SCHEMA IF NOT EXISTS "public"');
  });

  it("includes every checked-in migration unchanged so existing accounts can upgrade", () => {
    const root = path.join(process.cwd(), "prisma/migrations");
    const names = readdirSync(root).filter((name) => /^\d/.test(name)).sort();
    expect(snapshot.migrations.map(({ name }) => name)).toEqual(names);
    for (const migration of snapshot.migrations) {
      const sql = readFileSync(path.join(root, migration.name, "migration.sql"), "utf8");
      expect(migration.checksum).toBe(digest(sql));
      expect(migration.sql).toBe(sql);
    }
  });
});
