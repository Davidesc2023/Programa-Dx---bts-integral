import { NotFoundException } from '@nestjs/common';
import { OrderTestsService } from './order-tests.service';

const MOCK_ORDER = { id: 'uuid-o1' };

const MOCK_TEST = {
  id: 'uuid-t1',
  orderId: 'uuid-o1',
  examCode: 'HEM-001',
  examName: 'Hemograma completo',
  notes: null,
  createdAt: new Date(),
  createdBy: 'op-id',
};

const mockPrisma = {
  order: { findFirst: jest.fn() },
  orderTest: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

const CREATE_DTO = { examCode: 'HEM-001', examName: 'Hemograma completo', notes: null };

describe('OrderTestsService', () => {
  let service: OrderTestsService;

  beforeEach(() => {
    service = new OrderTestsService(mockPrisma as any);
    jest.clearAllMocks();
  });

  // ─── create() ────────────────────────────────────────────────────
  describe('create()', () => {
    it('crea un examen en la orden', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(MOCK_ORDER);
      mockPrisma.orderTest.create.mockResolvedValue(MOCK_TEST);

      const result = await service.create('uuid-o1', CREATE_DTO, 'op-id');

      expect(result.examCode).toBe('HEM-001');
      expect(mockPrisma.orderTest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: 'uuid-o1',
          examCode: 'HEM-001',
          examName: 'Hemograma completo',
          createdBy: 'op-id',
        }),
      });
    });

    it('lanza NotFoundException si la orden no existe', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.create('no-existe', CREATE_DTO, 'op-id')).rejects.toThrow(NotFoundException);

      expect(mockPrisma.orderTest.create).not.toHaveBeenCalled();
    });
  });

  // ─── findByOrder() ───────────────────────────────────────────────
  describe('findByOrder()', () => {
    it('retorna lista de exámenes de una orden', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(MOCK_ORDER);
      mockPrisma.orderTest.findMany.mockResolvedValue([MOCK_TEST]);

      const result = await service.findByOrder('uuid-o1');

      expect(result).toHaveLength(1);
      expect(result[0].examCode).toBe('HEM-001');
      expect(mockPrisma.orderTest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'asc' } }),
      );
    });

    it('lanza NotFoundException si la orden no existe', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findByOrder('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove() ────────────────────────────────────────────────────
  describe('remove()', () => {
    it('elimina el examen y retorna mensaje de confirmación', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(MOCK_ORDER);
      mockPrisma.orderTest.findFirst.mockResolvedValue(MOCK_TEST);
      mockPrisma.orderTest.delete.mockResolvedValue(MOCK_TEST);

      const result = await service.remove('uuid-o1', 'uuid-t1');

      expect(result).toEqual({ message: 'Examen eliminado' });
      expect(mockPrisma.orderTest.delete).toHaveBeenCalledWith({ where: { id: 'uuid-t1' } });
    });

    it('lanza NotFoundException si la orden no existe', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.remove('no-existe', 'uuid-t1')).rejects.toThrow(NotFoundException);

      expect(mockPrisma.orderTest.delete).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el examen no pertenece a la orden', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(MOCK_ORDER);
      mockPrisma.orderTest.findFirst.mockResolvedValue(null);

      await expect(service.remove('uuid-o1', 'uuid-otro')).rejects.toThrow(NotFoundException);

      expect(mockPrisma.orderTest.delete).not.toHaveBeenCalled();
    });
  });
});
