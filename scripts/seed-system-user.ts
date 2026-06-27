import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SYSTEM_USER_ID = 'system-ats-user';
const SYSTEM_USER_EMAIL = 'system@hiretivo.com';

async function main() {
  const user = await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    create: {
      id: SYSTEM_USER_ID,
      name: 'ATS System',
      email: SYSTEM_USER_EMAIL,
      isAdmin: true,
    },
    update: {},
  });

  console.log(`System ghost user seeded: ${user.id} (${user.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
