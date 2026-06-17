/*
 * seed-admin.ts
 * Bootstrap / backfill script for the admin user account.
 * Reads ADMIN_EMAIL + ADMIN_PASSWORD from env.
 *
 * Behaviour:
 * - If the user already exists: updates it to set isAdmin=true (backfill for migration).
 * - If the user does not exist: creates a new User with role=RECRUITER, isAdmin=true,
 *   a minimal RecruiterProfile, and bcrypt rounds=12 so the account can log in via
 *   /recruiter/login.
 *
 * Idempotent — safe to run multiple times. Always exits with isAdmin=true on the account.
 *
 * Run: pnpm seed:admin
 */

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@prisma/client";

/*
 * Prisma 7 requires the client to be constructed with a driver adapter.
 * Mirror the app's src/lib/prisma.ts setup so the script connects identically.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL env not set");
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
    });
    console.log(`Updated existing admin user: ${email} (isAdmin=true)`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      name: "Hiretivo Admin",
      role: Role.RECRUITER,
      isAdmin: true,
      passwordHash,
      emailVerified: new Date(),
      onboardingCompleted: true,
      recruiterProfile: {
        create: {
          companyName: "Hiretivo Admin",
          bio: "Internal admin account for curating sourced jobs.",
        },
      },
    },
  });

  console.log(`Created admin user: ${user.email} (id=${user.id}, isAdmin=true)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
