import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';
import { RedisService } from './redis.service.js';

export interface HealthStatus {
  status: 'ok' | 'error';
  database: 'up' | 'down';
  redis: 'up' | 'down' | 'not_configured';
  uptime: number;
  timestamp: string;
}

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  getHello(): string {
    return 'ok';
  }

  async getHealth(): Promise<HealthStatus> {
    let database: HealthStatus['database'] = 'up';
    let redis: HealthStatus['redis'] = this.redis.isConfigured
      ? 'up'
      : 'not_configured';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
      this.logger.warn('Database health check failed');
    }

    if (this.redis.isConfigured) {
      try {
        await this.redis.ping();
      } catch {
        redis = 'down';
        this.logger.warn('Redis health check failed');
      }
    }

    return {
      status: database === 'up' && redis !== 'down' ? 'ok' : 'error',
      database,
      redis,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
