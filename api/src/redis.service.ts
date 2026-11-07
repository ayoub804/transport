import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | undefined;
  private connecting: Promise<void> | undefined;
  private readonly redisUrl: string | undefined;

  constructor() {
    this.redisUrl = process.env.REDIS_URL;
  }

  get isConfigured(): boolean {
    return Boolean(this.redisUrl);
  }

  async ping(): Promise<void> {
    if (!this.redisUrl) {
      return;
    }

    if (!this.client || this.client.status === 'end') {
      this.client = new Redis(this.redisUrl, {
        lazyConnect: true,
        connectTimeout: 2000,
        commandTimeout: 2500,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        enableOfflineQueue: false,
      });
      this.client.on('error', () => {
        this.logger.warn('Redis connection emitted an error');
      });
    }

    const client = this.client;
    if (client.status === 'wait') {
      if (!this.connecting) {
        const connection = client.connect();
        this.connecting = connection;
        try {
          await connection;
        } finally {
          if (this.connecting === connection) {
            this.connecting = undefined;
          }
        }
      } else {
        await this.connecting;
      }
    }

    const response = await client.ping();
    if (response !== 'PONG') {
      throw new Error('Redis did not return PONG');
    }
  }

  onModuleDestroy(): void {
    this.client?.disconnect();
  }
}
