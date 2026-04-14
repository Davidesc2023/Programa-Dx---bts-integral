import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { ResultsService } from './results.service';

const mockPrisma = {
  order: { findFirst: jest.fn() },
  result: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('ResultsService', () => {
  let service: ResultsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear un resultado para orden EN_ANALISIS', async () => {
      const dto = { orderId: 'uuid-order', examType: 'Hemograma', value: '12.5', unit: 'g/dL' };
      const order = { id: 'uuid-order', status: 'EN_ANALISIS' };
      const expected = { id: 'uuid-result', ...dto };

      mockPrisma.order.findFirst.mockResolvedValue(order);
      mockPrisma.result.create.mockResolvedValue(expected);

      const result = await service.create(dto as any, 'user-id');
      expect(result).toEqual(expected);
    });

    it('debe lanzar ConflictException si orden está en PENDIENTE', async () => {
      const dto = { orderId: 'uuid-order', examType: 'Hemograma', value: '12.5' };
      const order = { id: 'uuid-order', status: 'PENDIENTE' };

      mockPrisma.order.findFirst.mockResolvedValue(order);

      await expect(service.create(dto as any, 'user-id')).rejects.toThrow(ConflictException);
    });

    it('debe lanzar NotFoundException si la orden no existe', async () => {
      const dto = { orderId: 'uuid-noop', examType: 'Glucosa', value: '95' };
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.create(dto as any, 'user-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('debe retornar el resultado si existe', async () => {
      const result = { id: 'uuid-result', examType: 'Hemograma', value: '12.5' };
      mockPrisma.result.findFirst.mockResolvedValue(result);

      const found = await service.findOne('uuid-result');
      expect(found).toEqual(result);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockPrisma.result.findFirst.mockResolvedValue(null);

      await expect(service.findOne('uuid-noop')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debe lanzar ConflictException si la orden de resultado ya no es editable', async () => {
      const result = { id: 'uuid-result', order: { id: 'uuid-order', status: 'CANCELADA', patientId: 'p' } };
      mockPrisma.result.findFirst.mockResolvedValue(result);

      await expect(service.update('uuid-result', { value: '10' }, 'user-id')).rejects.toThrow(ConflictException);
    });
  });
});
