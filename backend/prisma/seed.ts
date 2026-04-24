import 'dotenv/config';
import { seedBranch } from './seeds/seed-branch';
import { seedAccount } from './seeds/seed-account';
import { seedExcercise } from './seeds/seed-excercise';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { seedPtShiftSchedule } from './seeds/seed-ptShift-Schedule';
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  await seedBranch();
  await seedAccount();
  await seedExcercise();
  await seedPtShiftSchedule();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
