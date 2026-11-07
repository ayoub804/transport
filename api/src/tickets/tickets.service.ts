import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ReservationStatus, TripStatus, UserRole } from '@prisma/client';
import * as QRCode from 'qrcode';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { PrismaService } from '../prisma/prisma.service.js';

interface TicketPayload {
  sub: string;
}

@Injectable()
export class TicketsService {
  private readonly qrSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.qrSecret = config.getOrThrow<string>('QR_SECRET');
  }

  async getTicket(
    reservationId: string,
    user: AuthenticatedUser,
  ): Promise<{ reservationId: string; qrCodeDataUrl: string }> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        userId: true,
        status: true,
        trip: { select: { departureAt: true, status: true } },
      },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.userId !== user.id) {
      throw new ForbiddenException('You do not own this reservation');
    }
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new ConflictException(
        'A ticket is available only for a confirmed reservation',
      );
    }
    if (
      reservation.trip.status !== TripStatus.SCHEDULED ||
      reservation.trip.departureAt <= new Date()
    ) {
      throw new ConflictException('Ticket is not valid for this trip');
    }

    const token = await this.jwt.signAsync(
      { sub: reservation.id } satisfies TicketPayload,
      {
        secret: this.qrSecret,
        expiresIn: '30d',
        issuer: 'transport-api',
        audience: 'transport-ticket',
      },
    );
    const qrCodeDataUrl = await QRCode.toDataURL(token, {
      type: 'image/png',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
    });
    return { reservationId: reservation.id, qrCodeDataUrl };
  }

  async validateTicket(
    token: string,
    user: AuthenticatedUser,
  ): Promise<{ valid: true; message: string; reservationId: string }> {
    let payload: TicketPayload;
    try {
      payload = await this.jwt.verifyAsync<TicketPayload>(token, {
        secret: this.qrSecret,
        issuer: 'transport-api',
        audience: 'transport-ticket',
      });
    } catch {
      throw new UnauthorizedException('Ticket QR code is invalid or expired');
    }
    if (
      typeof payload.sub !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        payload.sub,
      )
    ) {
      throw new UnauthorizedException('Ticket QR code is invalid');
    }

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        status: true,
        trip: {
          select: {
            departureAt: true,
            status: true,
            driverId: true,
          },
        },
      },
    });
    if (!reservation)
      throw new NotFoundException('Ticket reservation not found');
    if (
      user.role === UserRole.DRIVER &&
      reservation.trip.driverId !== user.id
    ) {
      throw new ForbiddenException('You are not assigned to this trip');
    }
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new ConflictException(
        reservation.status === ReservationStatus.USED
          ? 'Ticket has already been used'
          : 'Ticket reservation is not confirmed',
      );
    }
    if (
      reservation.trip.status !== TripStatus.SCHEDULED ||
      reservation.trip.departureAt <= new Date()
    ) {
      throw new ConflictException('Ticket is not valid for this trip');
    }

    const updated = await this.prisma.reservation.updateMany({
      where: { id: reservation.id, status: ReservationStatus.CONFIRMED },
      data: { status: ReservationStatus.USED },
    });
    if (updated.count !== 1) {
      throw new ConflictException(
        'Ticket has already been used or is no longer confirmed',
      );
    }

    return {
      valid: true,
      message: 'Ticket validated successfully',
      reservationId: reservation.id,
    };
  }
}
