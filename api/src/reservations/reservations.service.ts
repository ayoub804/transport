import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservationStatus, TripStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { isPrismaError } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateReservationDto } from './dto/create-reservation.dto.js';
import type { ListReservationsQueryDto } from './dto/list-reservations-query.dto.js';
import type { UpdateReservationDto } from './dto/update-reservation.dto.js';

const reservationDetails = {
  trip: {
    include: {
      vehicle: { select: { id: true, plate: true, capacity: true } },
      driver: { select: { id: true, name: true, email: true } },
    },
  },
  user: { select: { id: true, name: true, email: true, role: true } },
} satisfies Prisma.ReservationInclude;

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreateReservationDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      include: { vehicle: { select: { capacity: true } } },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    this.assertBookableTrip(trip.status, trip.departureAt);
    this.assertSeatInRange(dto.seatNumber, trip.vehicle.capacity);

    try {
      return await this.prisma.reservation.create({
        data: {
          userId: user.id,
          tripId: trip.id,
          seatNumber: dto.seatNumber,
        },
        include: reservationDetails,
      });
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException(
          'This seat has already been reserved for the trip',
        );
      }
      if (isPrismaError(error, 'P2003')) {
        throw new NotFoundException('Trip or user not found');
      }
      throw error;
    }
  }

  findMine(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: reservationDetails,
      orderBy: { createdAt: 'desc' },
    });
  }

  findAll(query: ListReservationsQueryDto) {
    return this.prisma.reservation.findMany({
      where: {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.tripId ? { tripId: query.tripId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: reservationDetails,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForDriver(tripId: string, user: AuthenticatedUser) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { id: true, driverId: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.driverId !== user.id) {
      throw new ForbiddenException('You are not assigned to this trip');
    }
    return this.prisma.reservation.findMany({
      where: { tripId },
      include: reservationDetails,
      orderBy: { seatNumber: 'asc' },
    });
  }

  async update(id: string, user: AuthenticatedUser, dto: UpdateReservationDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { trip: true },
    });
    this.assertOwned(reservation, user.id);
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new ConflictException('Only confirmed reservations can be changed');
    }
    if (reservation.trip.departureAt <= new Date()) {
      throw new BadRequestException(
        'A reservation cannot be changed after its trip has departed',
      );
    }

    const targetTrip = await this.prisma.trip.findUnique({
      where: { id: dto.tripId },
      include: { vehicle: { select: { capacity: true } } },
    });
    if (!targetTrip) throw new NotFoundException('Target trip not found');
    this.assertBookableTrip(targetTrip.status, targetTrip.departureAt);
    const seatNumber = dto.seatNumber ?? reservation.seatNumber;
    this.assertSeatInRange(seatNumber, targetTrip.vehicle.capacity);

    try {
      return await this.prisma.reservation.update({
        where: { id },
        data: { tripId: targetTrip.id, seatNumber },
        include: reservationDetails,
      });
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException(
          'This seat has already been reserved for the trip',
        );
      }
      throw error;
    }
  }

  async cancel(id: string, user: AuthenticatedUser): Promise<void> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { trip: true },
    });
    this.assertOwned(reservation, user.id);
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new ConflictException(
        'Only confirmed reservations can be cancelled',
      );
    }
    if (reservation.trip.departureAt <= new Date()) {
      throw new BadRequestException(
        'A reservation cannot be cancelled after its trip has departed',
      );
    }
    await this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CANCELLED },
    });
  }

  private assertOwned<T extends { userId: string }>(
    reservation: T | null,
    userId: string,
  ): asserts reservation is T {
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.userId !== userId) {
      throw new ForbiddenException('You do not own this reservation');
    }
  }

  private assertBookableTrip(status: TripStatus, departureAt: Date): void {
    if (status !== TripStatus.SCHEDULED) {
      throw new ConflictException('Trip is not available for reservations');
    }
    if (departureAt <= new Date()) {
      throw new BadRequestException('Trip has already departed');
    }
  }

  private assertSeatInRange(seatNumber: number, capacity: number): void {
    if (
      !Number.isInteger(seatNumber) ||
      seatNumber < 1 ||
      seatNumber > capacity
    ) {
      throw new BadRequestException(
        `Seat number must be between 1 and ${capacity}`,
      );
    }
  }
}
