import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tripId!: string;

  @ApiProperty({ example: 12, minimum: 1 })
  @IsInt()
  @Min(1)
  seatNumber!: number;
}
