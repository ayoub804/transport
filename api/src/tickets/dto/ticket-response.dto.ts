import { ApiProperty } from '@nestjs/swagger';

export class TicketResponseDto {
  @ApiProperty({ format: 'uuid' })
  reservationId!: string;

  @ApiProperty({ example: 'data:image/png;base64,...' })
  qrCodeDataUrl!: string;
}
