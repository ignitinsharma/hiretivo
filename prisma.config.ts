import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Only load .env files if they exist (local dev)
// On Vercel, environment variables are injected automatically.
// DOTENV_CONFIG_PATH allows explicit deploy targets such as .env.prod.
const explicitEnvPath = process.env.DOTENV_CONFIG_PATH
  ? resolve(process.cwd(), process.env.DOTENV_CONFIG_PATH)
  : null;
const envPath = resolve(process.cwd(), ".env");
const envLocalPath = resolve(process.cwd(), ".env.local");

if (explicitEnvPath && existsSync(explicitEnvPath)) {
  loadEnv({ path: explicitEnvPath, override: true });
} else {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
  }
  if (existsSync(envLocalPath)) {
    loadEnv({ path: envLocalPath });
  }
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
