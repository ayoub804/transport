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
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { CreateTripDto } from './dto/create-trip.dto.js';
import { ListTripsQueryDto } from './dto/list-trips-query.dto.js';
import { UpdateTripDto } from './dto/update-trip.dto.js';
import { TripsService } from './trips.service.js';

@ApiTags('Trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @ApiOperation({
    summary: 'List scheduled trips, optionally filtered by route and date',
  })
  @ApiOkResponse({ description: 'Scheduled trips matching the filters' })
  findAll(@Query() query: ListTripsQueryDto) {
    return this.tripsService.findAll(query);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all trips for management (admin)' })
  @ApiOkResponse({ description: 'All trips including cancelled and completed' })
  findAllAdmin() {
    return this.tripsService.findAllAdmin();
  }

  @Get(':id/seats')
  @ApiOperation({ summary: 'List available and taken seats for a trip' })
  @ApiOkResponse({ description: 'Seat availability for each vehicle seat' })
  getSeats(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripsService.getSeats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trip details' })
  @ApiOkResponse({
    description: 'Trip details and public vehicle/driver summaries',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tripsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a trip (admin or driver; drivers are assigned automatically)' })
  @ApiCreatedResponse({ description: 'Created trip' })
  create(@Body() dto: CreateTripDto, @Req() request: Request & { user: AuthenticatedUser }) {
    return this.tripsService.create(request.user.role === UserRole.DRIVER
      ? { ...dto, driverId: request.user.id }
      : dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update trip details or assignments (admin)' })
  @ApiOkResponse({ description: 'Updated trip' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTripDto) {
    return this.tripsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a trip with no reservation history (admin)',
  })
  @ApiNoContentResponse({ description: 'Trip deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.tripsService.remove(id);
  }
}
