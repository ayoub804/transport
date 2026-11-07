import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { TicketResponseDto } from './dto/ticket-response.dto.js';
import { ValidateTicketDto } from './dto/validate-ticket.dto.js';
import { ValidateTicketResponseDto } from './dto/validate-ticket-response.dto.js';
import { TicketsService } from './tickets.service.js';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('reservations/:id/ticket')
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Get a signed QR ticket for an owned reservation' })
  @ApiOkResponse({ type: TicketResponseDto })
  getTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ticketsService.getTicket(id, request.user);
  }

  @Post('tickets/validate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Validate a ticket and mark its reservation used' })
  @ApiOkResponse({ type: ValidateTicketResponseDto })
  validate(
    @Body() dto: ValidateTicketDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.ticketsService.validateTicket(dto.token, request.user);
  }
}
