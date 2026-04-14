import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { AppointmentsService } from './appointments.service';

const mockPrisma = {
  patient: { findFirst: jest.fn() },
  order: { findFirst: jest.fn() },
  appointment: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear una cita para paciente válido', async () => {
      const dto = { patientId: 'p-id', scheduledAt: '2025-12-01T10:00:00Z' };
      const patient = { id: 'p-id' };
      const expected = { id: 'apt-id', ...dto, status: AppointmentStatus.PROGRAMADA };

      mockPrisma.patient.findFirst.mockResolvedValue(patient);
      mockPrisma.appointment.create.mockResolvedValue(expected);

      const result = await service.create(dto as any, 'user-id');
      expect(result).toEqual(expected);
    });

    it('debe lanzar NotFoundException si el paciente no existe', async () => {
      const dto = { patientId: 'p-noop', scheduledAt: '2025-12-01T10:00:00Z' };
      mockPrisma.patient.findFirst.mockResolvedValue(null);

      await expect(service.create(dto as any, 'user-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('debe retornar una cita si existe', async () => {
      const apt = { id: 'apt-id', status: AppointmentStatus.PROGRAMADA };
      mockPrisma.appointment.findFirst.mockResolvedValue(apt);

      const result = await service.findOne('apt-id');
      expect(result).toEqual(apt);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockPrisma.appointment.findFirst.mockResolvedValue(null);

      await expect(service.findOne('noop')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debe lanzar ConflictException si la cita está CANCELADA', async () => {
      const apt = { id: 'apt-id', status: AppointmentStatus.CANCELADA };
      mockPrisma.appointment.findFirst.mockResolvedValue(apt);

      await expect(
        service.update('apt-id', { notes: 'nuevo' }, 'user-id'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('debe lanzar ConflictException si la cita está COMPLETADA', async () => {
      const apt = { id: 'apt-id', status: AppointmentStatus.COMPLETADA };
      mockPrisma.appointment.findFirst.mockResolvedValue(apt);

      await expect(service.remove('apt-id', 'user-id')).rejects.toThrow(ConflictException);
    });
  });
});
