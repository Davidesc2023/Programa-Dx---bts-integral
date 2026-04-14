import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

const mockReflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;

const buildContext = (role: string): ExecutionContext =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role } }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let guard: RolesGuard;

  beforeEach(() => {
    guard = new RolesGuard(mockReflector);
  });

  it('permite acceso cuando no hay roles definidos', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(buildContext('OPERADOR'))).toBe(true);
  });

  it('permite acceso cuando el rol del usuario está en la lista', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN', 'OPERADOR']);
    expect(guard.canActivate(buildContext('OPERADOR'))).toBe(true);
  });

  it('lanza ForbiddenException cuando el rol no está permitido', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(buildContext('LABORATORIO'))).toThrow(ForbiddenException);
  });

  it('lanza ForbiddenException cuando no hay usuario en la request', () => {
    (mockReflector.getAllAndOverride as jest.Mock).mockReturnValue(['ADMIN']);
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user: null }) }),
    } as unknown as ExecutionContext;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
