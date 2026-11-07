import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'BUS-1234', minLength: 2, maxLength: 20 })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  plate!: string;

  @ApiProperty({ example: 40, minimum: 1 })
  @IsInt()
  @Min(1)
  capacity!: number;
}
