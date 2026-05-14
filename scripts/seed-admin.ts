/*
 * seed-admin.ts
 * One-time seed for the admin user account.
 * Reads ADMIN_EMAIL + ADMIN_PASSWORD from env, creates a User with role=RECRUITER
 * and a minimal RecruiterProfile so the user can log in via /auth/recruiter/login.
 * Idempotent — if the user already exists, this script no-ops and logs.
 *
 * Run: pnpm tsx scripts/seed-admin.ts
 */

import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

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
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: "Hiretivo Admin",
      role: Role.RECRUITER,
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

  console.log(`Created admin user: ${user.email} (id=${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
