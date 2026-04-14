import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockPrisma as any, mockJwtService as any);
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('crea usuario exitosamente y retorna datos sin password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-1',
        email: 'nuevo@test.com',
        role: 'OPERADOR',
      });

      const result = await service.register({
        email: 'nuevo@test.com',
        password: 'password123',
        role: 'OPERADOR',
      });

      expect(result).toEqual({ id: 'uuid-1', email: 'nuevo@test.com', role: 'OPERADOR' });
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'nuevo@test.com', role: 'OPERADOR' }),
        }),
      );
    });

    it('lanza ConflictException si el email ya existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({ email: 'dup@test.com', password: 'pass1234', role: 'OPERADOR' }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('hashea la contraseña con bcrypt cost=10 antes de persistir', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'uuid-1', email: data.email, role: data.role }),
      );
      const hashSpy = jest.spyOn(bcrypt, 'hash');

      await service.register({ email: 'hash@test.com', password: 'plaintext8', role: 'ADMIN' });

      expect(hashSpy).toHaveBeenCalledWith('plaintext8', 10);
    });
  });

  describe('login()', () => {
    it('retorna accessToken y refreshToken con credenciales correctas', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'uuid-1',
        email: 'admin@test.com',
        password: hashed,
        role: 'ADMIN',
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: 'admin@test.com', password: 'password123' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'uuid-1' }) }),
      );
    });

    it('lanza UnauthorizedException cuando el usuario no existe', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: 'cualquier' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lanza UnauthorizedException cuando la contraseña es incorrecta', async () => {
      const hashed = await bcrypt.hash('correcta123', 10);
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'uuid-1',
        email: 'u@test.com',
        password: hashed,
        role: 'OPERADOR',
      });

      await expect(
        service.login({ email: 'u@test.com', password: 'incorrecta' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout()', () => {
    it('invalida el refresh token sin lanzar error', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await expect(service.logout({ refreshToken: 'token-valido' })).resolves.not.toThrow();
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ token: 'token-valido', invalidatedAt: null }),
        }),
      );
    });

    it('es idempotente: no lanza error si el token ya estaba invalidado', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.logout({ refreshToken: 'token-ya-invalido' })).resolves.not.toThrow();
    });
  });
});
