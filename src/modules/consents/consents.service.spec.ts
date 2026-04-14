import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConsentsService } from './consents.service';
import { PatientResponse } from './dto/respond-consent.dto';

const MOCK_CONSENT = {
  id: 'uuid-c1',
  orderId: 'uuid-o1',
  status: 'PENDIENTE_FIRMA_MEDICO',
  doctorId: null,
  doctorSignedAt: null,
  patientResponseAt: null,
  notes: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'medico-id',
  updatedBy: null,
  order: {
    id: 'uuid-o1',
    status: 'CONSENT_PENDING',
    physician: 'Dr. García',
    patient: {
      id: 'uuid-p1',
      firstName: 'Juan',
      lastName: 'Pérez',
      documentType: 'DNI',
      documentNumber: '12345678',
      email: 'juan@test.com',
    },
  },
  doctor: null,
};

const mockPrisma = {
  order: { findFirst: jest.fn(), update: jest.fn() },
  consent: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockNotifications = {
  notifyConsentSentToPatient: jest.fn().mockResolvedValue(undefined),
  notifyConsentResponded: jest.fn().mockResolvedValue(undefined),
};

describe('ConsentsService', () => {
  let service: ConsentsService;

  beforeEach(() => {
    service = new ConsentsService(mockPrisma as any, mockNotifications as any);
    jest.clearAllMocks();
  });

  // ─── create() ────────────────────────────────────────────────────
  describe('create()', () => {
    it('crea consentimiento para orden en PENDIENTE', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ id: 'uuid-o1', status: 'PENDIENTE' });
      mockPrisma.consent.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockResolvedValue([MOCK_CONSENT]);

      const result = await service.create('uuid-o1', {}, 'medico-id');

      expect(result.orderId).toBe('uuid-o1');
      expect(result.status).toBe('PENDIENTE_FIRMA_MEDICO');
    });

    it('lanza NotFoundException si la orden no existe', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.create('no-existe', {}, 'medico-id')).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si la orden no está en PENDIENTE', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ id: 'uuid-o1', status: 'ACCEPTED' });

      await expect(service.create('uuid-o1', {}, 'medico-id')).rejects.toThrow(BadRequestException);
    });

    it('lanza ConflictException si ya existe un consentimiento', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ id: 'uuid-o1', status: 'PENDIENTE' });
      mockPrisma.consent.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create('uuid-o1', {}, 'medico-id')).rejects.toThrow(ConflictException);
    });
  });

  // ─── findByOrder() ────────────────────────────────────────────────
  describe('findByOrder()', () => {
    it('retorna el consentimiento de la orden', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ id: 'uuid-o1' });
      mockPrisma.consent.findUnique.mockResolvedValue(MOCK_CONSENT);

      const result = await service.findByOrder('uuid-o1');

      expect(result.orderId).toBe('uuid-o1');
    });

    it('lanza NotFoundException si la orden no existe', async () => {
      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findByOrder('no-existe')).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException si no hay consentimiento', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ id: 'uuid-o1' });
      mockPrisma.consent.findUnique.mockResolvedValue(null);

      await expect(service.findByOrder('uuid-o1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── sign() ──────────────────────────────────────────────────────
  describe('sign()', () => {
    it('firma el consentimiento en PENDIENTE_FIRMA_MEDICO', async () => {
      const signed = { ...MOCK_CONSENT, status: 'FIRMADO_MEDICO', doctorId: 'medico-id' };
      mockPrisma.consent.findUnique.mockResolvedValue(MOCK_CONSENT);
      mockPrisma.consent.update.mockResolvedValue(signed);

      const result = await service.sign('uuid-o1', {}, 'medico-id');

      expect(result.status).toBe('FIRMADO_MEDICO');
      expect(mockPrisma.consent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FIRMADO_MEDICO', doctorId: 'medico-id' }),
        }),
      );
    });

    it('lanza NotFoundException si el consentimiento no existe', async () => {
      mockPrisma.consent.findUnique.mockResolvedValue(null);

      await expect(service.sign('uuid-o1', {}, 'medico-id')).rejects.toThrow(NotFoundException);
    });

    it('lanza BadRequestException si ya está firmado', async () => {
      mockPrisma.consent.findUnique.mockResolvedValue({ ...MOCK_CONSENT, status: 'FIRMADO_MEDICO' });

      await expect(service.sign('uuid-o1', {}, 'medico-id')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── send() ──────────────────────────────────────────────────────
  describe('send()', () => {
    it('envía el consentimiento al paciente desde FIRMADO_MEDICO', async () => {
      const sent = { ...MOCK_CONSENT, status: 'ENVIADO_PACIENTE' };
      mockPrisma.consent.findUnique.mockResolvedValue({ ...MOCK_CONSENT, status: 'FIRMADO_MEDICO' });
      mockPrisma.consent.update.mockResolvedValue(sent);

      const result = await service.send('uuid-o1', 'medico-id');

      expect(result.status).toBe('ENVIADO_PACIENTE');
    });

    it('lanza BadRequestException si el consentimiento no está FIRMADO_MEDICO', async () => {
      mockPrisma.consent.findUnique.mockResolvedValue(MOCK_CONSENT); // PENDIENTE_FIRMA_MEDICO

      await expect(service.send('uuid-o1', 'medico-id')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── respond() ───────────────────────────────────────────────────
  describe('respond()', () => {
    const sentConsent = { ...MOCK_CONSENT, status: 'ENVIADO_PACIENTE' };

    it('registra respuesta ACEPTADO y cambia orden a ACCEPTED', async () => {
      const accepted = { ...MOCK_CONSENT, status: 'ACEPTADO' };
      mockPrisma.consent.findUnique.mockResolvedValue(sentConsent);
      mockPrisma.$transaction.mockResolvedValue([accepted]);

      const result = await service.respond('uuid-o1', { response: PatientResponse.ACEPTADO }, 'oper-id');

      expect(result.status).toBe('ACEPTADO');
    });

    it('registra respuesta RECHAZADO y cambia orden a RECHAZADA', async () => {
      const rejected = { ...MOCK_CONSENT, status: 'RECHAZADO' };
      mockPrisma.consent.findUnique.mockResolvedValue(sentConsent);
      mockPrisma.$transaction.mockResolvedValue([rejected]);

      const result = await service.respond('uuid-o1', { response: PatientResponse.RECHAZADO }, 'oper-id');

      expect(result.status).toBe('RECHAZADO');
    });

    it('lanza BadRequestException si el consentimiento no está ENVIADO_PACIENTE', async () => {
      mockPrisma.consent.findUnique.mockResolvedValue(MOCK_CONSENT); // PENDIENTE_FIRMA_MEDICO

      await expect(
        service.respond('uuid-o1', { response: PatientResponse.ACEPTADO }, 'oper-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('lanza NotFoundException si el consentimiento no existe', async () => {
      mockPrisma.consent.findUnique.mockResolvedValue(null);

      await expect(
        service.respond('uuid-o1', { response: PatientResponse.ACEPTADO }, 'oper-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
