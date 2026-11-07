import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AppService } from './app.service.js';
import type { HealthStatus } from './app.service.js';

@Controller()
@ApiTags('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): { status: string } {
    return { status: this.appService.getHello() };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check API and dependency health' })
  @ApiOkResponse({ description: 'The API dependencies are available' })
  @ApiServiceUnavailableResponse({
    description: 'A required dependency is unavailable',
  })
  async getHealth(
    @Res({ passthrough: true }) response: Response,
  ): Promise<HealthStatus> {
    const health = await this.appService.getHealth();
    if (health.status !== 'ok') {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return health;
  }
}
