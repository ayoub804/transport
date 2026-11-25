import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { jest } from '@jest/globals';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import type { PrismaService } from '../prisma/prisma.service.js';

const details = { name: 'New Driver', email: 'driver@example.com', password: 'TestPassword123!' };
const pipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

describe('Public registration roles', () => {
  const validate = (body: unknown) => pipe.transform(body, { type: 'body', metatype: RegisterDto });

  it.each(['CLIENT', 'DRIVER'] as const)('accepts and saves %s, excluding the password hash', async (role) => {
    const dto = await validate({ ...details, role });
    const create = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({ id: 'new-user', ...details, role });
    const service = new AuthService({ user: { create } } as unknown as PrismaService, {} as JwtService);
    await service.register(dto);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ role }),
      select: expect.not.objectContaining({ passwordHash: true }),
    }));
  });

  it('preserves passenger registration for older clients that omit role', async () => {
    const create = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({ id: 'new-user' });
    const service = new AuthService({ user: { create } } as unknown as PrismaService, {} as JwtService);
    await service.register(await validate(details));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ role: UserRole.CLIENT }) }));
  });

  it.each(['ADMIN', 'admin', 'driver', '', 'SUPERVISOR', 1, { role: 'ADMIN' }])('rejects invalid public role %j', async (role) => {
    await expect(validate({ ...details, role })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects admin escalation even when the service is called without DTO validation', async () => {
    const create = jest.fn();
    const service = new AuthService({ user: { create } } as unknown as PrismaService, {} as JwtService);
    await expect(service.register({ ...details, role: 'ADMIN' } as unknown as RegisterDto)).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });
});
