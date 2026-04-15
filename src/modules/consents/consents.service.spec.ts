import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConsentsService } from './consents.service';
import { PatientResponse } from './dto/respond-consent.dto';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const MOCK_CONSENT = {
  id: 'uuid-c1',
  orderId: 'uuid-o1',
  status: 'PENDIENTE_FIRMA_MEDICO',
  doctorId: null,
  doctorSignedAt: null,
  doctorNameSnapshot: null,
  patientNameSnapshot: null,
  patientSignedAt: null,
  accepted: null,
  documentHtml: null,
  documentPdfUrl: null,
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
    createdAt: new Date(),
    patient: {
      id: 'uuid-p1',
      firstName: 'Juan',
      lastName: 'Pérez',
      documentType: 'CC',
      documentNumber: '12345678',
      email: 'juan@test.com',
    },
  },
  doctor: null,
};

const MOCK_DOCTOR_USER = {
  firstName: 'Ana',
  lastName: 'López',
  specialty: 'Medicina General',
  medicalLicense: 'RM-123',
};

const MOCK_ORDER_DATA = {
  createdAt: new Date(),
  patient: {
    firstName: 'Juan',
    lastName: 'Pérez',
    documentType: 'CC',
    documentNumber: '12345678',
  },
};

const mockPrisma = {
  order: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  consent: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: { findUnique: jest.fn() },
  $transaction: jest.fn(),
};

const mockNotifications = {
  notifyConsentSentToPatient: jest.fn().mockResolvedValue(undefined),
  notifyConsentResponded: jest.fn().mockResolvedValue(undefined),
};

const mockPdfService = {
  generateConsentPdf: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
};

const mockStorageService = {
  uploadBuffer: jest.fn().mockResolvedValue('https://cdn.example.com/consents/uuid-o1/consent.pdf'),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ConsentsService', () => {
  let service: ConsentsService;

  beforeEach(() => {
    service = new ConsentsService(
      mockPrisma as any,
      mockNotifications as any,
      mockPdfService as any,
      mockStorageService as any,
    );
    jest.clearAllMocks();
  });

  // ─── create() ─────────────────────────────────────────────────────────────
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

  // ─── findByOrder() ────────────────────────────────────────────────────────
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

  // ─── sign() ───────────────────────────────────────────────────────────────
  describe('sign()', () => {
    it('firma el consentimiento y guarda doctorNameSnapshot + documentHtml', async () => {
      const signed = {
        ...MOCK_CONSENT,
        status: 'FIRMADO_MEDICO',
        doctorId: 'medico-id',
        doctorNameSnapshot: 'Ana López',
        documentHtml: '<html>consent</html>',
      };
      mockPrisma.consent.findUnique.mockResolvedValue(MOCK_CONSENT);
      mockPrisma.user.findUnique.mockResolvedValue(MOCK_DOCTOR_USER);
      mockPrisma.order.findUnique.mockResolvedValue(MOCK_ORDER_DATA);
      mockPrisma.consent.update.mockResolvedValue(signed);

      const result = await service.sign('uuid-o1', {}, 'medico-id');

      expect(result.status).toBe('FIRMADO_MEDICO');
      expect(result.doctorNameSnapshot).toBe('Ana López');
      expect(mockPrisma.consent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FIRMADO_MEDICO',
            doctorId: 'medico-id',
            doctorNameSnapshot: 'Ana López',
            documentHtml: expect.stringContaining('<!DOCTYPE html>'),
          }),
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

    it('lanza NotFoundException si el médico no existe en la BD', async () => {
      mockPrisma.consent.findUnique.mockResolvedValue(MOCK_CONSENT);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.sign('uuid-o1', {}, 'medico-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── send() ───────────────────────────────────────────────────────────────
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

    it('NO se puede enviar sin firma médica — regla de negocio central', async () => {
      // Orden recién creada: estado PENDIENTE_FIRMA_MEDICO — enviar debe fallar
      mockPrisma.consent.findUnique.mockResolvedValue({
        ...MOCK_CONSENT,
        status: 'PENDIENTE_FIRMA_MEDICO',
      });

      await expect(service.send('uuid-o1', 'admin-id')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── respond() ────────────────────────────────────────────────────────────
  describe('respond()', () => {
    const sentConsent = {
      ...MOCK_CONSENT,
      status: 'ENVIADO_PACIENTE',
      documentHtml: '<html>consent</html>',
      doctorNameSnapshot: 'Ana López',
      doctorSignedAt: new Date(),
    };

    it('ACEPTADO: guarda patientNameSnapshot, accepted=true, genera PDF y sube a R2', async () => {
      const accepted = { ...MOCK_CONSENT, status: 'ACEPTADO', accepted: true, documentPdfUrl: 'https://cdn.example.com/consent.pdf' };
      mockPrisma.consent.findUnique.mockResolvedValue(sentConsent);
      mockPrisma.order.findUnique.mockResolvedValue(MOCK_ORDER_DATA);
      mockPrisma.$transaction.mockResolvedValue([accepted]);

      const result = await service.respond('uuid-o1', { response: PatientResponse.ACEPTADO }, 'oper-id');

      expect(result.status).toBe('ACEPTADO');
      expect(mockPdfService.generateConsentPdf).toHaveBeenCalledTimes(1);
      expect(mockStorageService.uploadBuffer).toHaveBeenCalledWith(
        expect.stringContaining('consents/uuid-o1/'),
        expect.any(Buffer),
        'application/pdf',
      );
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([expect.anything(), expect.anything()]),
      );
    });

    it('RECHAZADO: guarda accepted=false, NO genera PDF ni sube a R2', async () => {
      const rejected = { ...MOCK_CONSENT, status: 'RECHAZADO', accepted: false };
      mockPrisma.consent.findUnique.mockResolvedValue(sentConsent);
      mockPrisma.order.findUnique.mockResolvedValue(MOCK_ORDER_DATA);
      mockPrisma.$transaction.mockResolvedValue([rejected]);

      const result = await service.respond('uuid-o1', { response: PatientResponse.RECHAZADO }, 'oper-id');

      expect(result.status).toBe('RECHAZADO');
      expect(mockPdfService.generateConsentPdf).not.toHaveBeenCalled();
      expect(mockStorageService.uploadBuffer).not.toHaveBeenCalled();
    });

    it('ACEPTADO: si el PDF falla, el consentimiento se acepta igual (resiliencia)', async () => {
      mockPdfService.generateConsentPdf.mockRejectedValueOnce(new Error('Chromium error'));
      const accepted = { ...MOCK_CONSENT, status: 'ACEPTADO', accepted: true, documentPdfUrl: null };
      mockPrisma.consent.findUnique.mockResolvedValue(sentConsent);
      mockPrisma.order.findUnique.mockResolvedValue(MOCK_ORDER_DATA);
      mockPrisma.$transaction.mockResolvedValue([accepted]);

      // Should not throw even if PDF generation fails
      const result = await service.respond('uuid-o1', { response: PatientResponse.ACEPTADO }, 'oper-id');

      expect(result.status).toBe('ACEPTADO');
      expect(mockStorageService.uploadBuffer).not.toHaveBeenCalled();
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
