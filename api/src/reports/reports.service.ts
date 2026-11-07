import { Injectable } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const [totalReservations, cancelledReservations, trips] = await Promise.all(
      [
        this.prisma.reservation.count(),
        this.prisma.reservation.count({
          where: { status: ReservationStatus.CANCELLED },
        }),
        this.prisma.trip.findMany({
          orderBy: { departureAt: 'asc' },
          select: {
            id: true,
            origin: true,
            destination: true,
            departureAt: true,
            status: true,
          },
        }),
      ],
    );

    const reservationsPerTrip = await this.prisma.reservation.groupBy({
      by: ['tripId', 'status'],
      _count: { _all: true },
    });
    const tripCounts = new Map<string, number>();
    for (const group of reservationsPerTrip) {
      if (group.status === ReservationStatus.CANCELLED) continue;
      tripCounts.set(
        group.tripId,
        (tripCounts.get(group.tripId) ?? 0) + group._count._all,
      );
    }

    return {
      totalReservations,
      cancellationRate:
        totalReservations === 0 ? 0 : cancelledReservations / totalReservations,
      reservationsPerTrip: trips.map((trip) => ({
        ...trip,
        reservationCount: tripCounts.get(trip.id) ?? 0,
      })),
    };
  }
}
