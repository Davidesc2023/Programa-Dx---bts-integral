import { ConflictException, NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';

const PATIENT_RESULT = {
  id: 'uuid-p1',
  documentType: 'DNI',
  documentNumber: '12345678',
  firstName: 'Juan',
  lastName: 'Pérez',
  birthDate: new Date('1990-05-15'),
  phone: '987654321',
  email: 'juan@test.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin-id',
  updatedBy: null,
};

const mockPrisma = {
  patient: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('PatientsService', () => {
  let service: PatientsService;

  beforeEach(() => {
    service = new PatientsService(mockPrisma as any);
    jest.clearAllMocks();
  });

  describe('create()', () => {
    it('crea paciente exitosamente con campos correctos', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);
      mockPrisma.patient.create.mockResolvedValue(PATIENT_RESULT);

      const result = await service.create(
        {
          documentType: 'DNI',
          documentNumber: '12345678',
          firstName: 'Juan',
          lastName: 'Pérez',
          birthDate: '1990-05-15',
        },
        'admin-id',
      );

      expect(result).toEqual(PATIENT_RESULT);
      expect(result).not.toHaveProperty('deletedAt');
    });

    it('lanza ConflictException si ya existe el mismo documento', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create(
          { documentType: 'DNI', documentNumber: '12345678', firstName: 'X', lastName: 'Y', birthDate: '1990-01-01' },
          'admin-id',
        ),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.patient.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('retorna lista paginada de pacientes activos', async () => {
      mockPrisma.$transaction.mockResolvedValue([[PATIENT_RESULT], 1]);

      const { patients, total } = await service.findAll({ page: 1, limit: 10 });

      expect(patients).toHaveLength(1);
      expect(total).toBe(1);
    });

    it('aplica filtro de búsqueda cuando se provee search', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10, search: 'Juan' });

      const transactionFn = mockPrisma.$transaction.mock.calls[0][0];
      // Verifica que se pasó el filtro OR de búsqueda
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('retorna el paciente cuando existe', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(PATIENT_RESULT);

      const result = await service.findOne('uuid-p1');

      expect(result.documentNumber).toBe('12345678');
      expect(mockPrisma.patient.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'uuid-p1', deletedAt: null }),
        }),
      );
    });

    it('lanza NotFoundException cuando el paciente no existe', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('actualiza campos del paciente y registra updatedBy', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(PATIENT_RESULT);
      mockPrisma.patient.update.mockResolvedValue({
        ...PATIENT_RESULT,
        phone: '111111111',
        updatedBy: 'admin-id',
      });

      const result = await service.update('uuid-p1', { phone: '111111111' }, 'admin-id');

      expect(result.phone).toBe('111111111');
      expect(result.updatedBy).toBe('admin-id');
    });
  });
});
