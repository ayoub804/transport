import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTripDto {
  @ApiProperty({ example: 'Paris', minLength: 1, maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  origin!: string;

  @ApiProperty({ example: 'Lyon', minLength: 1, maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  destination!: string;

  @ApiProperty({ example: '2027-01-15T09:00:00.000Z' })
  @IsDateString()
  departureAt!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vehicleId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  driverId?: string | null;
}
