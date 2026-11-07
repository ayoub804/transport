import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';
import { RolesGuard } from '../common/roles.guard.js';

@Module({
  imports: [ConfigModule, JwtModule.register({})],
  controllers: [TicketsController],
  providers: [TicketsService, RolesGuard],
})
export class TicketsModule {}
