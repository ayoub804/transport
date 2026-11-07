import { PrismaClient, TripStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@transport.local' },
    update: {},
    create: {
      name: 'Local Admin',
      email: 'admin@transport.local',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
  const driver = await prisma.user.upsert({
    where: { email: 'driver@transport.local' },
    update: {},
    create: {
      name: 'Local Driver',
      email: 'driver@transport.local',
      passwordHash: await bcrypt.hash('Driver123!', 12),
      role: UserRole.DRIVER,
    },
  });
  await prisma.user.upsert({
    where: { email: 'client@transport.local' },
    update: {},
    create: {
      name: 'Local Client',
      email: 'client@transport.local',
      passwordHash: await bcrypt.hash('Client123!', 12),
      role: UserRole.CLIENT,
    },
  });

  const vehicles = await Promise.all([
    prisma.vehicle.upsert({
      where: { plate: 'LOCAL-001' },
      update: {},
      create: { plate: 'LOCAL-001', capacity: 40 },
    }),
    prisma.vehicle.upsert({
      where: { plate: 'LOCAL-002' },
      update: {},
      create: { plate: 'LOCAL-002', capacity: 32 },
    }),
  ]);
  const departures = [1, 2, 3].map((days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(9, 0, 0, 0);
    return date;
  });
  const trips = [
    {
      origin: 'City A',
      destination: 'City B',
      departureAt: departures[0],
      vehicleId: vehicles[0].id,
      driverId: driver.id,
    },
    {
      origin: 'City B',
      destination: 'City C',
      departureAt: departures[1],
      vehicleId: vehicles[1].id,
      driverId: driver.id,
    },
    {
      origin: 'City A',
      destination: 'City C',
      departureAt: departures[2],
      vehicleId: vehicles[0].id,
      driverId: null,
    },
  ];

  for (const [index, trip] of trips.entries()) {
    const id = `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    await prisma.trip.upsert({
      where: { id },
      update: { ...trip, status: TripStatus.SCHEDULED },
      create: {
        id,
        ...trip,
        status: TripStatus.SCHEDULED,
      },
    });
  }
  console.log(
    `Seeded admin ${admin.email}, driver, client, 2 vehicles, and 3 trips.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
