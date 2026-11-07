import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class ValidateTicketDto {
  @ApiProperty({ description: 'Signed QR ticket JWT' })
  @IsJWT()
  token!: string;
}
