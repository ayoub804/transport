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
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../common/roles.decorator.js';
import { RolesGuard } from '../common/roles.guard.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehiclesService } from './vehicles.service.js';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DRIVER)
  @ApiOperation({ summary: 'List vehicles (admin or driver)' })
  @ApiOkResponse({ description: 'Vehicles ordered by creation time' })
  findAll() {
    return this.vehiclesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle (admin)' })
  @ApiOkResponse({ description: 'Vehicle details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a vehicle (admin)' })
  @ApiCreatedResponse({ description: 'Created vehicle' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vehicle (admin)' })
  @ApiOkResponse({ description: 'Updated vehicle' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an unused vehicle (admin)' })
  @ApiNoContentResponse({ description: 'Vehicle deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.vehiclesService.remove(id);
  }
}
