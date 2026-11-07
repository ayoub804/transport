import { ApiProperty } from '@nestjs/swagger';
import { TripStatus } from '@prisma/client';

export class TripReservationSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Paris' })
  origin!: string;

  @ApiProperty({ example: 'Lyon' })
  destination!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  departureAt!: Date;

  @ApiProperty({ enum: TripStatus })
  status!: TripStatus;

  @ApiProperty({
    example: 18,
    description: 'Count of non-cancelled reservations, including used tickets',
  })
  reservationCount!: number;
}
