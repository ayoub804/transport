import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { jest } from '@jest/globals';
import { AuthService } from './auth.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
  };
  let jwt: { signAsync: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    jwt = { signAsync: jest.fn().mockResolvedValue('signed-access-token') };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
    );
  });

  it('registers new accounts as clients and returns no password hash', async () => {
    prisma.user.create.mockImplementation(async ({ data, select }) => ({
      id: 'user-id',
      name: data.name,
      email: data.email,
      role: data.role,
      createdAt: new Date(),
      ...(select.passwordHash ? { passwordHash: data.passwordHash } : {}),
    }));

    const result = await service.register({
      name: ' Passenger ',
      email: 'PASSENGER@example.com',
      password: 'StrongPass123!',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Passenger',
          email: 'passenger@example.com',
          role: UserRole.CLIENT,
        }),
        select: expect.not.objectContaining({ passwordHash: true }),
      }),
    );
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('translates duplicate email errors to HTTP conflict', async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['email'] },
      },
    );
    prisma.user.create.mockRejectedValue(duplicateError);

    await expect(
      service.register({
        name: 'Passenger',
        email: 'passenger@example.com',
        password: 'StrongPass123!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns a signed token for valid credentials', async () => {
    const passwordHash = await bcrypt.hash('StrongPass123!', 4);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'passenger@example.com',
      passwordHash,
    });

    await expect(
      service.login({
        email: 'PASSENGER@example.com',
        password: 'StrongPass123!',
      }),
    ).resolves.toEqual({ accessToken: 'signed-access-token' });
    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 'user-id',
      email: 'passenger@example.com',
    });
  });

  it('rejects invalid credentials with the same response', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'StrongPass123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
