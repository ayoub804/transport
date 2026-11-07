import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateReservationDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Scheduled trip to move this booking to',
  })
  @IsUUID()
  tripId!: string;

  @ApiPropertyOptional({
    example: 12,
    minimum: 1,
    description: 'Seat on the new trip; defaults to the current seat number',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  seatNumber?: number;
}
