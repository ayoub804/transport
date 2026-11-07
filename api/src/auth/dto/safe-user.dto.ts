import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class SafeUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Sam Passenger' })
  name!: string;

  @ApiProperty({ example: 'passenger@example.com' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CLIENT })
  role!: UserRole;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
