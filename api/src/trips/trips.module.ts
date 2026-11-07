import { Module } from '@nestjs/common';
import { TripsController } from './trips.controller.js';
import { TripsService } from './trips.service.js';
import { RolesGuard } from '../common/roles.guard.js';

@Module({
  controllers: [TripsController],
  providers: [TripsService, RolesGuard],
  exports: [TripsService],
})
export class TripsModule {}
