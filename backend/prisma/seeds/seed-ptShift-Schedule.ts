import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { ShiftType } from '../../generated/prisma/enums';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

export async function seedPtShiftSchedule() {
  const templates = [
    { type: ShiftType.MORNING, startTime: '07:00', endTime: '09:00' },
    { type: ShiftType.AFTERNOON, startTime: '15:00', endTime: '17:00' },
    { type: ShiftType.EVENING, startTime: '18:00', endTime: '20:00' },
  ];

  await prisma.$transaction(
    templates.map((item) =>
      prisma.ptShiftTemplate.upsert({
        where: { type: item.type },
        update: {
          startTime: item.startTime,
          endTime: item.endTime,
          isActive: true,
        },
        create: {
          type: item.type,
          startTime: item.startTime,
          endTime: item.endTime,
          isActive: true,
        },
      }),
    ),
  );

  console.log('Seeded PtShiftTemplate: MORNING, AFTERNOON, EVENING');
}
