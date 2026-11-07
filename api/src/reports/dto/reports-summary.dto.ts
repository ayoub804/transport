import { ApiProperty } from '@nestjs/swagger';
import { TripReservationSummaryDto } from './trip-reservation-summary.dto.js';

export class ReportsSummaryDto {
  @ApiProperty({ example: 125 })
  totalReservations!: number;

  @ApiProperty({
    example: 0.08,
    description: 'Cancelled reservations divided by all reservation records',
  })
  cancellationRate!: number;

  @ApiProperty({ type: [TripReservationSummaryDto] })
  reservationsPerTrip!: TripReservationSummaryDto[];
}
