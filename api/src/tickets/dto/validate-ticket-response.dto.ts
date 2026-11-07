import { ApiProperty } from '@nestjs/swagger';

export class ValidateTicketResponseDto {
  @ApiProperty({ example: true })
  valid!: true;

  @ApiProperty({ example: 'Ticket validated successfully' })
  message!: string;

  @ApiProperty({ format: 'uuid' })
  reservationId!: string;
}
