import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma, TripStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTripDto } from './dto/create-trip.dto.js';
import type { UpdateTripDto } from './dto/update-trip.dto.js';
import type { ListTripsQueryDto } from './dto/list-trips-query.dto.js';
import { isPrismaError } from '../common/prisma-errors.js';

const tripDetails = {
  vehicle: { select: { id: true, plate: true, capacity: true } },
  driver: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TripInclude;

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: ListTripsQueryDto) {
    const dateStart = query.date
      ? new Date(`${query.date.slice(0, 10)}T00:00:00.000Z`)
      : undefined;
    const dateEnd = dateStart
      ? new Date(dateStart.getTime() + 24 * 60 * 60 * 1000)
      : undefined;

    return this.prisma.trip.findMany({
      where: {
        status: TripStatus.SCHEDULED,
        ...(query.origin
          ? { origin: { contains: query.origin.trim(), mode: 'insensitive' } }
          : {}),
        ...(query.destination
          ? {
              destination: {
                contains: query.destination.trim(),
                mode: 'insensitive',
              },
            }
          : {}),
        ...(dateStart && dateEnd
          ? { departureAt: { gte: dateStart, lt: dateEnd } }
          : {}),
      },
      include: tripDetails,
      orderBy: { departureAt: 'asc' },
    });
  }

  findAllAdmin() {
    return this.prisma.trip.findMany({
      include: tripDetails,
      orderBy: { departureAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: tripDetails,
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async getSeats(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        vehicle: { select: { capacity: true } },
        reservations: {
          where: { status: { in: ['CONFIRMED', 'USED'] } },
          select: { seatNumber: true },
        },
      },
    });
    if (!trip) throw new NotFoundException('Trip not found');

    const takenSeats = new Set(
      trip.reservations.map(({ seatNumber }) => seatNumber),
    );
    return {
      tripId: trip.id,
      capacity: trip.vehicle.capacity,
      seats: Array.from({ length: trip.vehicle.capacity }, (_, index) => {
        const seatNumber = index + 1;
        return { seatNumber, available: !takenSeats.has(seatNumber) };
      }),
    };
  }

  async create(dto: CreateTripDto) {
    await this.validateAssignments(dto.vehicleId, dto.driverId);
    try {
      return await this.prisma.trip.create({
        data: {
          origin: dto.origin.trim(),
          destination: dto.destination.trim(),
          departureAt: new Date(dto.departureAt),
          vehicleId: dto.vehicleId,
          driverId: dto.driverId ?? null,
        },
        include: tripDetails,
      });
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2003')) {
        throw new NotFoundException('Assigned vehicle or driver not found');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateTripDto) {
    await this.findOne(id);
    const vehicle = await this.validateAssignments(dto.vehicleId, dto.driverId);
    if (vehicle) {
      const reservation = await this.prisma.reservation.findFirst({
        where: {
          tripId: id,
          status: { in: ['CONFIRMED', 'USED'] },
          seatNumber: { gt: vehicle.capacity },
        },
        select: { id: true },
      });
      if (reservation) {
        throw new ConflictException(
          'Vehicle capacity is too small for existing reservations',
        );
      }
    }

    try {
      return await this.prisma.trip.update({
        where: { id },
        data: {
          ...(dto.origin === undefined ? {} : { origin: dto.origin.trim() }),
          ...(dto.destination === undefined
            ? {}
            : { destination: dto.destination.trim() }),
          ...(dto.departureAt === undefined
            ? {}
            : { departureAt: new Date(dto.departureAt) }),
          ...(dto.vehicleId === undefined ? {} : { vehicleId: dto.vehicleId }),
          ...(dto.driverId === undefined ? {} : { driverId: dto.driverId }),
          ...(dto.status === undefined ? {} : { status: dto.status }),
        },
        include: tripDetails,
      });
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2003')) {
        throw new NotFoundException('Assigned vehicle or driver not found');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const reservation = await this.prisma.reservation.findFirst({
      where: { tripId: id },
      select: { id: true },
    });
    if (reservation) {
      throw new ConflictException(
        'Trip has reservations and cannot be deleted; cancel the trip instead',
      );
    }
    await this.prisma.trip.delete({ where: { id } });
  }

  private async validateAssignments(
    vehicleId?: string,
    driverId?: string | null,
  ): Promise<{ capacity: number } | undefined> {
    let vehicle: { id: string; capacity: number } | null = null;
    if (vehicleId) {
      vehicle = await this.prisma.vehicle.findUnique({
        where: { id: vehicleId },
        select: { id: true, capacity: true },
      });
      if (!vehicle) throw new NotFoundException('Vehicle not found');
    }
    if (driverId) {
      const driver = await this.prisma.user.findUnique({
        where: { id: driverId },
        select: { id: true, role: true },
      });
      if (!driver) throw new NotFoundException('Driver not found');
      if (driver.role !== UserRole.DRIVER) {
        throw new UnprocessableEntityException(
          'Assigned user must have the DRIVER role',
        );
      }
    }
    return vehicle ?? undefined;
  }
}
