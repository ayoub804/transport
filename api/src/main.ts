import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    (request: Request, response: Response, next: NextFunction): void => {
      const startedAt = Date.now();
      response.on('finish', () => {
        Logger.log(
          JSON.stringify({
            event: 'http_request',
            method: request.method,
            path: request.path,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
          }),
          'Request',
        );
      });
      next();
    },
  );
  app.use(helmet());
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Transport Reservation API')
    .setDescription('Authentication and transport reservation API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
  Logger.log(`API listening on port ${port}`, 'Bootstrap');
}

await bootstrap();
