import { jest } from '@jest/globals';
import { ReservationStatus } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ReportsService } from './reports.service.js';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: {
    reservation: { count: jest.Mock; groupBy: jest.Mock };
    trip: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      reservation: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      trip: { findMany: jest.fn() },
    };
    service = new ReportsService(prisma as unknown as PrismaService);
  });

  it('returns the total, cancellation rate, and non-cancelled counts per trip', async () => {
    prisma.reservation.count.mockResolvedValueOnce(4).mockResolvedValueOnce(1);
    prisma.trip.findMany.mockResolvedValue([
      {
        id: 'trip-1',
        origin: 'A',
        destination: 'B',
        departureAt: new Date(),
        status: 'SCHEDULED',
        _count: { reservations: 3 },
      },
      {
        id: 'trip-2',
        origin: 'B',
        destination: 'C',
        departureAt: new Date(),
        status: 'SCHEDULED',
        _count: { reservations: 1 },
      },
    ]);
    prisma.reservation.groupBy.mockResolvedValue([
      {
        tripId: 'trip-1',
        status: ReservationStatus.CONFIRMED,
        _count: { _all: 2 },
      },
      {
        tripId: 'trip-1',
        status: ReservationStatus.CANCELLED,
        _count: { _all: 1 },
      },
      {
        tripId: 'trip-1',
        status: ReservationStatus.USED,
        _count: { _all: 1 },
      },
      {
        tripId: 'trip-2',
        status: ReservationStatus.CANCELLED,
        _count: { _all: 1 },
      },
    ]);

    const result = await service.getSummary();

    expect(result.totalReservations).toBe(4);
    expect(result.cancellationRate).toBe(0.25);
    expect(
      result.reservationsPerTrip.map((trip) => trip.reservationCount),
    ).toEqual([3, 0]);
  });

  it('returns a zero cancellation rate when there are no reservations', async () => {
    prisma.reservation.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    prisma.trip.findMany.mockResolvedValue([]);
    prisma.reservation.groupBy.mockResolvedValue([]);

    await expect(service.getSummary()).resolves.toEqual({
      totalReservations: 0,
      cancellationRate: 0,
      reservationsPerTrip: [],
    });
  });
});
