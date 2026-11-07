import { ApiProperty } from '@nestjs/swagger';

export class AccessTokenDto {
  @ApiProperty({ description: 'Bearer access token' })
  accessToken!: string;
}
