/*
 * seed-admin.ts
 * One-time seed for the admin user account (seeker-only platform).
 * Reads ADMIN_EMAIL + ADMIN_PASSWORD from env, upserts a User with
 * role=SEEKER and isAdmin=true so /admin is accessible.
 * Idempotent — updates passwordHash/isAdmin if the user already exists.
 *
 * Run: pnpm seed:admin
 */

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email) {
    console.error("ADMIN_EMAIL env not set");
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error("ADMIN_PASSWORD env not set or too short (min 8 chars)");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Hiretivo Admin",
      role: "SEEKER",
      isAdmin: true,
      passwordHash,
      emailVerified: new Date(),
      onboardingCompleted: true,
    },
    update: {
      isAdmin: true,
      passwordHash,
      emailVerified: new Date(),
      onboardingCompleted: true,
    },
  });

  console.log(`Admin user ready: ${user.email} (id=${user.id}, isAdmin=${user.isAdmin})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
