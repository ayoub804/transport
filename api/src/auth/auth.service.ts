import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AuthenticatedUser,
  JwtPayload,
  SafeUser,
} from './auth.types.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<SafeUser> {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          passwordHash,
          role: UserRole.CLIENT,
        },
        select: safeUserSelect,
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };
    return { accessToken: await this.jwt.signAsync(payload) };
  }

  async getProfile(user: AuthenticatedUser): Promise<SafeUser> {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: safeUserSelect,
    });
    if (!profile) throw new UnauthorizedException('User no longer exists');
    return profile;
  }
}
