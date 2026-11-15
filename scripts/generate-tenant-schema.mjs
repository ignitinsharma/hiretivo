import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const sql = execFileSync("yarn", ["prisma", "migrate", "diff", "--from-empty", "--to-schema", "prisma/schema.prisma", "--script"], { encoding: "utf8" })
  .replace(/-- CreateSchema\s+CREATE SCHEMA IF NOT EXISTS "public";\s*/, "");
const migrations = readdirSync("prisma/migrations").filter((name) => /^\d/.test(name)).sort().map((name) => {
  const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8");
  return { name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
});
writeFileSync("src/lib/tenancy/schema.json", JSON.stringify({ schemaHash: createHash("sha256").update(readFileSync("prisma/schema.prisma")).digest("hex"), sql, migrations }, null, 2) + "\n");
