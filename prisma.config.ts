import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Only load .env files if they exist (local dev)
// On Vercel, environment variables are injected automatically
const envPath = resolve(process.cwd(), ".env");
const envLocalPath = resolve(process.cwd(), ".env.local");

if (existsSync(envPath)) {
  loadEnv({ path: envPath });
}
if (existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder@localhost/placeholder",
  },
});
