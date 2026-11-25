import 'reflect-metadata';
import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { TripsController } from './trips.controller.js';
import type { TripsService } from './trips.service.js';
import { VehiclesController } from '../vehicles/vehicles.controller.js';
import { RolesGuard } from '../common/roles.guard.js';

describe('Driver trip creation', () => {
  const dto = { origin: 'Paris', destination: 'Lyon', departureAt: '2027-01-15T09:00:00Z', vehicleId: 'vehicle', driverId: 'another-driver' };

  it.each([undefined, null, 'another-driver'])('assigns the authenticated driver when supplied driverId is %s', (driverId) => {
    const create = jest.fn();
    const controller = new TripsController({ create } as unknown as TripsService);
    controller.create({ ...dto, driverId }, { user: { id: 'signed-in-driver', role: UserRole.DRIVER } } as Parameters<TripsController['create']>[1]);
    expect(create).toHaveBeenCalledWith({ ...dto, driverId: 'signed-in-driver' });
  });

  it('preserves admin assignments', () => {
    const create = jest.fn();
    new TripsController({ create } as unknown as TripsService).create(dto, { user: { id: 'admin', role: UserRole.ADMIN } } as Parameters<TripsController['create']>[1]);
    expect(create).toHaveBeenCalledWith(dto);
  });

  const guard = new RolesGuard(new Reflector());
  function allowed(controller: typeof TripsController | typeof VehiclesController, handler: unknown, role?: UserRole) {
    return guard.canActivate({ getClass: () => controller, getHandler: () => handler, switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }) } as unknown as ExecutionContext);
  }

  it('allows drivers to create trips and list vehicles, but not modify fleet or other trips', () => {
    expect(allowed(TripsController, TripsController.prototype.create, UserRole.DRIVER)).toBe(true);
    expect(allowed(VehiclesController, VehiclesController.prototype.findAll, UserRole.DRIVER)).toBe(true);
    for (const handler of [VehiclesController.prototype.create, VehiclesController.prototype.update, VehiclesController.prototype.remove]) {
      expect(allowed(VehiclesController, handler, UserRole.DRIVER)).toBe(false);
    }
    expect(allowed(TripsController, TripsController.prototype.update, UserRole.DRIVER)).toBe(false);
    expect(allowed(TripsController, TripsController.prototype.remove, UserRole.DRIVER)).toBe(false);
  });

  it.each([UserRole.CLIENT, undefined])('denies creation and vehicle listing for %s', (role) => {
    expect(allowed(TripsController, TripsController.prototype.create, role)).toBe(false);
    expect(allowed(VehiclesController, VehiclesController.prototype.findAll, role)).toBe(false);
  });
});
