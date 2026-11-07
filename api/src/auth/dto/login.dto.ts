import { ApiProperty } from '@nestjs/swagger';
import { IsByteLength, IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
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
