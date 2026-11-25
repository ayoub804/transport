import { ApiProperty } from '@nestjs/swagger';
import {
  IsByteLength,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ enum: ['CLIENT', 'DRIVER'], default: 'CLIENT', required: false })
  @IsOptional()
  @IsIn(['CLIENT', 'DRIVER'])
  role?: 'CLIENT' | 'DRIVER';

  @ApiProperty({ example: 'Sam Passenger', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'passenger@example.com' })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 8, maxLength: 72 })
  @IsString()
  @IsByteLength(8, 72)
  @MaxLength(72)
  password!: string;
}
