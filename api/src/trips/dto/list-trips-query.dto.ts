import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class ListTripsQueryDto {
  @ApiPropertyOptional({ example: 'Paris' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  origin?: string;

  @ApiPropertyOptional({ example: 'Lyon' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  destination?: string;

  @ApiPropertyOptional({
    example: '2027-01-15',
    description: 'UTC calendar date',
  })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
