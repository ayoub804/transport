import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { isPrismaError } from '../common/prisma-errors.js';
import type { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto.js';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    try {
      return await this.prisma.vehicle.create({
        data: {
          plate: dto.plate.trim().toUpperCase(),
          capacity: dto.capacity,
        },
      });
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('A vehicle with this plate already exists');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);
    if (dto.capacity !== undefined) {
      const reservation = await this.prisma.reservation.findFirst({
        where: {
          seatNumber: { gt: dto.capacity },
          status: { in: ['CONFIRMED', 'USED'] },
          trip: { vehicleId: id },
        },
        select: { id: true },
      });
      if (reservation) {
        throw new ConflictException(
          'Capacity cannot be reduced below an occupied seat number',
        );
      }
    }

    try {
      return await this.prisma.vehicle.update({
        where: { id },
        data: {
          ...(dto.plate === undefined
            ? {}
            : { plate: dto.plate.trim().toUpperCase() }),
          ...(dto.capacity === undefined ? {} : { capacity: dto.capacity }),
        },
      });
    } catch (error: unknown) {
      if (isPrismaError(error, 'P2002')) {
        throw new ConflictException('A vehicle with this plate already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const trip = await this.prisma.trip.findFirst({
      where: { vehicleId: id },
      select: { id: true },
    });
    if (trip) {
      throw new ConflictException('Vehicle is assigned to one or more trips');
    }
    await this.prisma.vehicle.delete({ where: { id } });
  }
}
