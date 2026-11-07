import { Module } from '@nestjs/common';
import {
  DriverReservationsController,
  ReservationsController,
} from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';
import { RolesGuard } from '../common/roles.guard.js';

@Module({
  controllers: [ReservationsController, DriverReservationsController],
  providers: [ReservationsService, RolesGuard],
})
export class ReservationsModule {}
