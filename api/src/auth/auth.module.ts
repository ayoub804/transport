import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './jwt.strategy.js';
import { RolesGuard } from '../common/roles.guard.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresInSeconds = Number(
          config.get<string>('JWT_EXPIRES_IN_SECONDS') ?? 900,
        );
        if (!Number.isSafeInteger(expiresInSeconds) || expiresInSeconds <= 0) {
          throw new Error('JWT_EXPIRES_IN_SECONDS must be a positive integer');
        }
        return {
          secret: config.getOrThrow<string>('JWT_SECRET'),
          signOptions: { expiresIn: expiresInSeconds },
        };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
})
export class AuthModule {}
