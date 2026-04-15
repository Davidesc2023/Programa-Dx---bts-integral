import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PatientPortalService } from './patient-portal.service';

// ─── Shared fixtures ─────────────────────────────────────────────────────────

const USER_ID = 'user-uuid-1';
const PATIENT_ID = 'patient-uuid-1';
const ORDER_ID = 'order-uuid-1';
const CONSENT_ID = 'consent-uuid-1';

const mockPatient = { id: PATIENT_ID };

// ─── Mock PrismaService ───────────────────────────────────────────────────────

const mockPrisma = {
  patient: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  consent: {
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  result: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  appointment: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockConsents = {
  respond: jest.fn(),
};
const mockAttachments = {
  download: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PatientPortalService', () => {
  let service: PatientPortalService;

  beforeEach(() => {
    service = new PatientPortalService(mockPrisma as any, mockConsents as any, mockAttachments as any);
    jest.clearAllMocks();
  });

  // ── getMe() ─────────────────────────────────────────────────────────────────

  describe('getMe()', () => {
    it('retorna el usuario con patientProfile cuando existe', async () => {
      const userResult = {
        id: USER_ID,
        email: 'pac@test.com',
        role: 'PACIENTE',
        firstName: 'Juan',
        lastName: 'Pérez',
        patientProfile: { id: PATIENT_ID, firstName: 'Juan', lastName: 'Pérez' },
      };
      mockPrisma.user.findFirst.mockResolvedValue(userResult);

      const result = await service.getMe(USER_ID);
      expect(result).toEqual(userResult);
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: USER_ID, deletedAt: null } }),
      );
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(service.getMe(USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── ForbiddenException cuando no hay vínculo ─────────────────────────────────

  describe('getLinkedPatient() (via getDashboard)', () => {
    it('lanza ForbiddenException si userId no está vinculado a ningún paciente', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);
      await expect(service.getDashboard(USER_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── getDashboard() ───────────────────────────────────────────────────────────

  describe('getDashboard()', () => {
    it('retorna conteos y próxima cita cuando el paciente está vinculado', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      const nextAppt = {
        id: 'appt-1',
        scheduledAt: new Date('2026-12-01T10:00:00Z'),
        status: 'PROGRAMADA',
        notes: null,
      };
      mockPrisma.$transaction.mockResolvedValue([2, 1, 3, nextAppt]);

      const result = await service.getDashboard(USER_ID);
      expect(result).toEqual({
        activeOrders: 2,
        pendingConsents: 1,
        availableResults: 3,
        nextAppointment: nextAppt,
      });
    });
  });

  // ── getOrders() ──────────────────────────────────────────────────────────────

  describe('getOrders()', () => {
    it('retorna lista de órdenes del paciente vinculado', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      const orders = [{ id: ORDER_ID, status: 'COMPLETADA' }];
      mockPrisma.order.findMany.mockResolvedValue(orders);

      const result = await service.getOrders(USER_ID);
      expect(result).toEqual(orders);
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { patientId: PATIENT_ID, deletedAt: null } }),
      );
    });
  });

  // ── respondConsent() ─────────────────────────────────────────────────────────

  describe('respondConsent()', () => {
    const mockConsent = {
      id: CONSENT_ID,
      orderId: ORDER_ID,
      status: 'ENVIADO_PACIENTE',
      order: { patientId: PATIENT_ID },
    };

    it('acepta el consentimiento y actualiza el estado de la orden', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.consent.findFirst.mockResolvedValue(mockConsent);
      const updatedConsent = { ...mockConsent, status: 'ACEPTADO' };
      mockConsents.respond.mockResolvedValue(updatedConsent);

      const result = await service.respondConsent(USER_ID, CONSENT_ID, true, {});
      expect(result).toEqual(updatedConsent);
      expect(mockConsents.respond).toHaveBeenCalledWith(
        ORDER_ID,
        { response: 'ACEPTADO', notes: undefined },
        USER_ID,
      );
    });

    it('rechaza el consentimiento y actualiza el estado de la orden', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.consent.findFirst.mockResolvedValue(mockConsent);
      const updatedConsent = { ...mockConsent, status: 'RECHAZADO' };
      mockConsents.respond.mockResolvedValue(updatedConsent);

      const result = await service.respondConsent(USER_ID, CONSENT_ID, false, { notes: 'No estoy de acuerdo' });
      expect(result).toEqual(updatedConsent);
      expect(mockConsents.respond).toHaveBeenCalledWith(
        ORDER_ID,
        { response: 'RECHAZADO', notes: 'No estoy de acuerdo' },
        USER_ID,
      );
    });

    it('lanza NotFoundException si el consentimiento no existe o no pertenece al paciente', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      mockPrisma.consent.findFirst.mockResolvedValue(null);

      await expect(
        service.respondConsent(USER_ID, CONSENT_ID, true, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('lanza ForbiddenException si el usuario no tiene paciente vinculado', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(null);
      await expect(
        service.respondConsent(USER_ID, CONSENT_ID, true, {}),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── getResults() ─────────────────────────────────────────────────────────────

  describe('getResults()', () => {
    it('retorna resultados del paciente vinculado', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      const results = [{ id: 'res-1', examType: 'Glucosa', value: '90' }];
      mockPrisma.result.findMany.mockResolvedValue(results);

      const result = await service.getResults(USER_ID);
      expect(result).toEqual(results);
    });
  });

  // ── getAppointments() ────────────────────────────────────────────────────────

  describe('getAppointments()', () => {
    it('retorna citas del paciente vinculado', async () => {
      mockPrisma.patient.findFirst.mockResolvedValue(mockPatient);
      const appts = [{ id: 'appt-1', scheduledAt: new Date(), status: 'PROGRAMADA' }];
      mockPrisma.appointment.findMany.mockResolvedValue(appts);

      const result = await service.getAppointments(USER_ID);
      expect(result).toEqual(appts);
    });
  });
});
