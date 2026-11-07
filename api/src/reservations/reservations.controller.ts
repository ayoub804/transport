import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { ListReservationsQueryDto } from './dto/list-reservations-query.dto.js';
import { UpdateReservationDto } from './dto/update-reservation.dto.js';
import { ReservationsService } from './reservations.service.js';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Reserve a seat on a scheduled trip (client)' })
  @ApiCreatedResponse({ description: 'Confirmed reservation' })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateReservationDto,
  ) {
    return this.reservationsService.create(request.user, dto);
  }

  @Get('me')
  @Roles(UserRole.CLIENT)
  @ApiOperation({
    summary: 'List the authenticated client reservation history',
  })
  @ApiOkResponse({
    description: 'Reservations owned by the authenticated client',
  })
  findMine(@Req() request: AuthenticatedRequest) {
    return this.reservationsService.findMine(request.user.id);
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT)
  @ApiOperation({
    summary: 'Move a confirmed reservation to another trip (client)',
  })
  @ApiOkResponse({ description: 'Updated reservation' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, request.user, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Cancel a confirmed reservation before departure' })
  @ApiNoContentResponse({ description: 'Reservation cancelled' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.reservationsService.cancel(id, request.user);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List reservations with optional filters (admin)' })
  @ApiOkResponse({ description: 'Reservations matching the filters' })
  findAll(@Query() query: ListReservationsQueryDto) {
    return this.reservationsService.findAll(query);
  }
}

@ApiTags('Driver')
@ApiBearerAuth()
@Controller('driver/trips')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DRIVER)
export class DriverReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get(':tripId/reservations')
  @ApiOperation({ summary: 'List reservations for the assigned trip (driver)' })
  @ApiOkResponse({ description: 'Trip reservations ordered by seat number' })
  findForDriver(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reservationsService.findForDriver(tripId, request.user);
  }
}
