import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';

const ORDER_RESULT = {
  id: 'uuid-o1',
  patientId: 'uuid-p1',
  physician: 'Dr. GarcÃ­a',
  doctorId: null,
  priority: 'NORMAL',
  observations: null,
  estimatedCompletionDate: null,
  status: 'PENDIENTE',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'operador-id',
  updatedBy: null,
  patient: { id: 'uuid-p1', firstName: 'Juan', lastName: 'PÃ©rez', documentType: 'DNI', documentNumber: '12345678' },
  doctor: null,
  tests: [],
};

const mockPrisma = {
  patient: { findFirst: jest.fn() },
  order: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(() => {
    service = new OrdersService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('crea orden con status PENDIENTE para paciente activo', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({ id: 'uuid-p1' });
      mockPrisma.order.create.mockResolvedValue(ORDER_RESULT);

      const result = await service.create(
        { patientId: 'uuid-p1', physician: 'Dr. GarcÃ­a', priority: 'NORMAL' },
        'operador-id',
      );

      expect(result.status).toBe('PENDIENTE');
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PENDIENTE', patientId: 'uuid-p1' }),
        }),
      );
    });

    it('crea orden con doctorId cuando se proporciona', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({ id: 'uuid-p1' });
      mockPrisma.order.create.mockResolvedValue({ ...ORDER_RESULT, doctorId: 'uuid-doc1' });

      const result = await service.create(
        { patientId: 'uuid-p1', doctorId: 'uuid-doc1' },
        'operador-id',
      );

      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ doctorId: 'uuid-doc1' }),
        }),
      );
    });

    it('lanza NotFoundException si el paciente no existe o estÃ¡ eliminado', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ patientId: 'no-existe' }, 'operador-id'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.order.create).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus()', () => {
    it('transiciÃ³n vÃ¡lida ACCEPTED â†’ SCHEDULED para OPERADOR', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...ORDER_RESULT, status: 'ACCEPTED' });
      mockPrisma.order.update.mockResolvedValue({ ...ORDER_RESULT, status: 'SCHEDULED' });

      const result = await service.updateStatus('uuid-o1', 'SCHEDULED', 'OPERADOR', 'oper-id');

      expect(result.status).toBe('SCHEDULED');
    });

    it('transiciÃ³n vÃ¡lida SCHEDULED â†’ MUESTRA_RECOLECTADA para LABORATORIO', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...ORDER_RESULT, status: 'SCHEDULED' });
      mockPrisma.order.update.mockResolvedValue({
        ...ORDER_RESULT,
        status: 'MUESTRA_RECOLECTADA',
      });

      const result = await service.updateStatus(
        'uuid-o1',
        'MUESTRA_RECOLECTADA',
        'LABORATORIO',
        'lab-id',
      );

      expect(result.status).toBe('MUESTRA_RECOLECTADA');
    });

    it('transiciÃ³n vÃ¡lida PENDIENTE â†’ CANCELADA para ADMIN', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(ORDER_RESULT);
      mockPrisma.order.update.mockResolvedValue({ ...ORDER_RESULT, status: 'CANCELADA' });

      const result = await service.updateStatus('uuid-o1', 'CANCELADA', 'ADMIN', 'admin-id');

      expect(result.status).toBe('CANCELADA');
    });

    it('lanza UnprocessableEntityException para transiciÃ³n invÃ¡lida (PENDIENTE â†’ COMPLETADA)', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(ORDER_RESULT); // status=PENDIENTE

      await expect(
        service.updateStatus('uuid-o1', 'COMPLETADA', 'ADMIN', 'admin-id'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('lanza UnprocessableEntityException si ACCEPTED â†’ MUESTRA_RECOLECTADA (ya no vÃ¡lido en v5)', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...ORDER_RESULT, status: 'ACCEPTED' });

      await expect(
        service.updateStatus('uuid-o1', 'MUESTRA_RECOLECTADA', 'LABORATORIO', 'lab-id'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('lanza UnprocessableEntityException si el rol no puede ejecutar la transiciÃ³n', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...ORDER_RESULT, status: 'SCHEDULED' });

      await expect(
        service.updateStatus('uuid-o1', 'MUESTRA_RECOLECTADA', 'OPERADOR', 'oper-id'),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('lanza UnprocessableEntityException en estado terminal COMPLETADA', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...ORDER_RESULT, status: 'COMPLETADA' });

      await expect(
        service.updateStatus('uuid-o1', 'CANCELADA', 'ADMIN', 'admin-id'),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('update()', () => {
    it('lanza ConflictException si la orden no estÃ¡ en PENDIENTE', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...ORDER_RESULT, status: 'EN_ANALISIS' });

      await expect(
        service.update('uuid-o1', { physician: 'Dr. Nuevo' }, 'oper-id'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove()', () => {
    it('lanza ConflictException si la orden no estÃ¡ en PENDIENTE', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ ...ORDER_RESULT, status: 'MUESTRA_RECOLECTADA' });

      await expect(service.remove('uuid-o1', 'oper-id')).rejects.toThrow(ConflictException);
    });
  });
});
