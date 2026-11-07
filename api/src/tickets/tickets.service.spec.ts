import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ReservationStatus, TripStatus, UserRole } from '@prisma/client';
import { jest } from '@jest/globals';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { TicketsService } from './tickets.service.js';

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: {
    reservation: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let jwt: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  const client: AuthenticatedUser = {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'client@example.com',
    role: UserRole.CLIENT,
  };
  const driver: AuthenticatedUser = {
    id: '00000000-0000-4000-8000-000000000002',
    email: 'driver@example.com',
    role: UserRole.DRIVER,
  };
  const reservationId = '00000000-0000-4000-8000-000000000003';
  const reservation = {
    id: reservationId,
    userId: client.id,
    status: ReservationStatus.CONFIRMED,
    trip: {
      departureAt: new Date(Date.now() + 60_000),
      status: TripStatus.SCHEDULED,
      driverId: driver.id,
    },
  };

  beforeEach(() => {
    prisma = {
      reservation: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt'),
      verifyAsync: jest.fn().mockResolvedValue({ sub: reservationId }),
    };
    service = new TicketsService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      {
        getOrThrow: jest.fn().mockReturnValue('qr-secret'),
      } as unknown as ConfigService,
    );
  });

  it('creates a QR data URL containing only a signed reservation identifier token', async () => {
    prisma.reservation.findUnique.mockResolvedValue(reservation);

    const result = await service.getTicket(reservationId, client);

    expect(result.reservationId).toBe(reservationId);
    expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: reservationId },
      expect.objectContaining({ secret: 'qr-secret' }),
    );
    expect(JSON.stringify(result)).not.toContain(client.email);
  });

  it('does not allow a client to get another owner ticket', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...reservation,
      userId: '00000000-0000-4000-8000-000000000099',
    });

    await expect(
      service.getTicket(reservationId, client),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('does not allow an admin to retrieve another user ticket', async () => {
    prisma.reservation.findUnique.mockResolvedValue(reservation);
    const admin: AuthenticatedUser = {
      id: '00000000-0000-4000-8000-000000000099',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    };

    await expect(
      service.getTicket(reservationId, admin),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('marks a confirmed ticket USED on first validation', async () => {
    prisma.reservation.findUnique.mockResolvedValue(reservation);
    prisma.reservation.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.validateTicket('signed-jwt', driver)).resolves.toEqual(
      {
        valid: true,
        message: 'Ticket validated successfully',
        reservationId,
      },
    );
    expect(prisma.reservation.updateMany).toHaveBeenCalledWith({
      where: { id: reservationId, status: ReservationStatus.CONFIRMED },
      data: { status: ReservationStatus.USED },
    });
  });

  it('rejects invalid signatures', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('invalid signature'));

    await expect(
      service.validateTicket('invalid-jwt', driver),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.reservation.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a second scan after the reservation has been used', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...reservation,
      status: ReservationStatus.USED,
    });

    await expect(service.validateTicket('signed-jwt', driver)).rejects.toThrow(
      'Ticket has already been used',
    );
    expect(prisma.reservation.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a confirmed ticket after the trip departure time', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...reservation,
      trip: { ...reservation.trip, departureAt: new Date(Date.now() - 1_000) },
    });

    await expect(service.validateTicket('signed-jwt', driver)).rejects.toThrow(
      'Ticket is not valid for this trip',
    );
    expect(prisma.reservation.updateMany).not.toHaveBeenCalled();
  });

  it('rejects tickets for cancelled trips', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...reservation,
      trip: { ...reservation.trip, status: TripStatus.CANCELLED },
    });

    await expect(service.validateTicket('signed-jwt', driver)).rejects.toThrow(
      'Ticket is not valid for this trip',
    );
    expect(prisma.reservation.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a driver not assigned to the ticket trip', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...reservation,
      trip: { ...reservation.trip, driverId: 'another-driver' },
    });

    await expect(
      service.validateTicket('signed-jwt', driver),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects concurrent scans when the conditional update loses the race', async () => {
    prisma.reservation.findUnique.mockResolvedValue(reservation);
    prisma.reservation.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.validateTicket('signed-jwt', driver),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
