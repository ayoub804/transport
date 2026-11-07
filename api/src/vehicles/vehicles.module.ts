import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller.js';
import { VehiclesService } from './vehicles.service.js';
import { RolesGuard } from '../common/roles.guard.js';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService, RolesGuard],
})
export class VehiclesModule {}
