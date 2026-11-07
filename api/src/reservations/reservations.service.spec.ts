import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { jest } from '@jest/globals';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ReservationsService } from './reservations.service.js';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: {
    trip: { findUnique: jest.Mock };
    reservation: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
  };
  const client: AuthenticatedUser = {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'client@example.com',
    role: UserRole.CLIENT,
  };
  const departureAt = new Date(Date.now() + 60 * 60 * 1000);
  const trip = {
    id: '00000000-0000-4000-8000-000000000010',
    status: 'SCHEDULED',
    departureAt,
    vehicle: { capacity: 40 },
  };

  beforeEach(() => {
    prisma = {
      trip: { findUnique: jest.fn() },
      reservation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new ReservationsService(prisma as unknown as PrismaService);
  });

  it('returns HTTP 409 when the database rejects a duplicate seat booking', async () => {
    prisma.trip.findUnique.mockResolvedValue(trip);
    prisma.reservation.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['tripId', 'seatNumber'] },
      }),
    );

    await expect(
      service.create(client, {
        tripId: trip.id,
        seatNumber: 8,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns HTTP 403 when a client changes someone else reservation', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: 'reservation-id',
      userId: 'another-client-id',
      status: 'CONFIRMED',
      trip: { departureAt },
    });

    await expect(
      service.update('reservation-id', client, { tripId: trip.id }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns HTTP 400 when the requested seat exceeds vehicle capacity', async () => {
    prisma.trip.findUnique.mockResolvedValue(trip);

    await expect(
      service.create(client, {
        tripId: trip.id,
        seatNumber: 41,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.reservation.create).not.toHaveBeenCalled();
  });

  it('returns HTTP 403 when a client cancels someone else reservation', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: 'reservation-id',
      userId: 'another-client-id',
      status: 'CONFIRMED',
      trip: { departureAt },
    });

    await expect(
      service.cancel('reservation-id', client),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.reservation.update).not.toHaveBeenCalled();
  });
});
