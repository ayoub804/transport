import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'BUS-1234', minLength: 2, maxLength: 20 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  plate?: string;

  @ApiPropertyOptional({ example: 40, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;
}
