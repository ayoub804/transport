import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';
import { TripsModule } from './trips/trips.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RedisService } from './redis.service.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),
    PrismaModule,
    AuthModule,
    VehiclesModule,
    TripsModule,
    ReservationsModule,
    TicketsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RedisService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
