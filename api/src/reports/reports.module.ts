import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { RolesGuard } from '../common/roles.guard.js';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, RolesGuard],
})
export class ReportsModule {}
