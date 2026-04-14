import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

const USER_SELECT_RESULT = {
  id: 'uuid-1',
  email: 'u@test.com',
  role: 'OPERADOR',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin-id',
  updatedBy: null,
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('crea usuario exitosamente y retorna campos sin password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(USER_SELECT_RESULT);

      const result = await service.create(
        { email: 'u@test.com', password: 'password123', role: 'OPERADOR' },
        'admin-id',
      );

      expect(result).toEqual(USER_SELECT_RESULT);
      expect(result).not.toHaveProperty('password');
    });

    it('lanza ConflictException si el email ya existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({ email: 'dup@test.com', password: 'pass1234', role: 'OPERADOR' }, 'admin-id'),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('hashea la contraseña con bcrypt antes de guardar', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(USER_SELECT_RESULT);
      const hashSpy = jest.spyOn(bcrypt, 'hash');

      await service.create({ email: 'n@test.com', password: 'pass12345', role: 'ADMIN' }, 'admin-id');

      expect(hashSpy).toHaveBeenCalledWith('pass12345', 10);
    });
  });

  describe('findOne()', () => {
    it('retorna el usuario cuando existe y no está eliminado', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(USER_SELECT_RESULT);

      const result = await service.findOne('uuid-1');

      expect(result.email).toBe('u@test.com');
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'uuid-1', deletedAt: null }),
        }),
      );
    });

    it('lanza NotFoundException cuando el usuario no existe o está eliminado', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.findOne('uuid-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('actualiza el rol y registra updatedBy', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(USER_SELECT_RESULT);
      mockPrisma.user.update.mockResolvedValue({ ...USER_SELECT_RESULT, role: 'ADMIN', updatedBy: 'admin-id' });

      const result = await service.update('uuid-1', { role: 'ADMIN' }, 'admin-id');

      expect(result.role).toBe('ADMIN');
      expect(result.updatedBy).toBe('admin-id');
    });
  });
});
