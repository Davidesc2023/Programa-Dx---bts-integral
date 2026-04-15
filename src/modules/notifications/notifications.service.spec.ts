import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

// Mock Resend module
const mockSend = jest.fn().mockResolvedValue({ id: 'mock-email-id' });
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

describe('NotificationsService', () => {
  let service: NotificationsService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── Modo logger (sin RESEND_API_KEY) ─────────────────────────────
  describe('modo logger (sin RESEND_API_KEY)', () => {
    it('notifyConsentSentToPatient registra log cuando el paciente tiene email', async () => {
      await service.notifyConsentSentToPatient({
        orderId: 'uuid-o1',
        patientEmail: 'paciente@test.com',
        patientName: 'Juan Pérez',
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('paciente@test.com'),
      );
    });

    it('notifyConsentSentToPatient registra warn cuando no hay email', async () => {
      await service.notifyConsentSentToPatient({
        orderId: 'uuid-o1',
        patientEmail: null,
        patientName: 'Juan Pérez',
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sin email para paciente'),
      );
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('notifyConsentResponded registra log ACEPTADO cuando el médico tiene email', async () => {
      await service.notifyConsentResponded({
        orderId: 'uuid-o1',
        doctorEmail: 'medico@test.com',
        patientName: 'Juan Pérez',
        response: 'ACEPTADO',
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('medico@test.com'),
      );
    });

    it('notifyConsentResponded registra log RECHAZADO cuando el médico tiene email', async () => {
      await service.notifyConsentResponded({
        orderId: 'uuid-o1',
        doctorEmail: 'medico@test.com',
        patientName: 'Juan Pérez',
        response: 'RECHAZADO',
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('medico@test.com'),
      );
    });

    it('notifyConsentResponded registra warn cuando no hay email de médico', async () => {
      await service.notifyConsentResponded({
        orderId: 'uuid-o1',
        doctorEmail: null,
        patientName: 'Juan Pérez',
        response: 'ACEPTADO',
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sin email de médico'),
      );
    });

    it('notifyResultReady registra log para médico y paciente', async () => {
      await service.notifyResultReady({
        orderId: 'uuid-o1',
        patientEmail: 'paciente@test.com',
        patientName: 'Juan Pérez',
        doctorEmail: 'medico@test.com',
        doctorName: 'Dr. García',
      });

      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('medico@test.com'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('paciente@test.com'));
    });

    it('notifyResultReady solo notifica al médico si no hay email del paciente', async () => {
      await service.notifyResultReady({
        orderId: 'uuid-o1',
        patientEmail: null,
        patientName: 'Juan Pérez',
        doctorEmail: 'medico@test.com',
        doctorName: 'Dr. García',
      });

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('medico@test.com'));
    });

    it('notifyResultReady registra warn si no hay email del médico', async () => {
      await service.notifyResultReady({
        orderId: 'uuid-o1',
        patientEmail: 'paciente@test.com',
        patientName: 'Juan Pérez',
        doctorEmail: null,
        doctorName: 'Dr. García',
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sin email de médico'),
      );
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('paciente@test.com'));
    });

    it('todos los métodos retornan void y no lanzan excepciones', async () => {
      await expect(
        service.notifyConsentSentToPatient({ orderId: 'o1', patientEmail: 'x@x.com', patientName: 'X' }),
      ).resolves.toBeUndefined();

      await expect(
        service.notifyConsentResponded({ orderId: 'o1', doctorEmail: 'x@x.com', patientName: 'X', response: 'ACEPTADO' }),
      ).resolves.toBeUndefined();

      await expect(
        service.notifyResultReady({ orderId: 'o1', patientEmail: null, patientName: 'X', doctorEmail: null, doctorName: 'D' }),
      ).resolves.toBeUndefined();
    });
  });

  // ─── Modo Resend (con RESEND_API_KEY configurada) ─────────────────
  describe('modo Resend (con RESEND_API_KEY)', () => {
    let resendService: NotificationsService;

    beforeEach(() => {
      process.env.RESEND_API_KEY = 'test-api-key';
      resendService = new NotificationsService();
    });

    afterEach(() => {
      delete process.env.RESEND_API_KEY;
    });

    it('llama a resend.emails.send al enviar consentimiento al paciente', async () => {
      await resendService.notifyConsentSentToPatient({
        orderId: 'uuid-o1',
        patientEmail: 'paciente@test.com',
        patientName: 'Juan Pérez',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'paciente@test.com',
          subject: expect.stringContaining('uuid-o1'),
          html: expect.stringContaining('Juan Pérez'),
        }),
      );
    });

    it('llama a resend.emails.send al notificar respuesta de consentimiento', async () => {
      await resendService.notifyConsentResponded({
        orderId: 'uuid-o1',
        doctorEmail: 'medico@test.com',
        patientName: 'Juan Pérez',
        response: 'ACEPTADO',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'medico@test.com',
          subject: expect.stringContaining('ACEPTADO'),
        }),
      );
    });

    it('llama a resend.emails.send dos veces al notificar resultado listo (médico + paciente)', async () => {
      await resendService.notifyResultReady({
        orderId: 'uuid-o1',
        patientEmail: 'paciente@test.com',
        patientName: 'Juan Pérez',
        doctorEmail: 'medico@test.com',
        doctorName: 'Dr. García',
      });

      expect(mockSend).toHaveBeenCalledTimes(2);
      const calls = mockSend.mock.calls.map((c: [{ to: string }]) => c[0].to);
      expect(calls).toContain('medico@test.com');
      expect(calls).toContain('paciente@test.com');
    });

    it('no falla si resend.emails.send lanza error — registra error y continúa', async () => {
      mockSend.mockRejectedValueOnce(new Error('API timeout'));

      await expect(
        resendService.notifyConsentSentToPatient({
          orderId: 'uuid-o1',
          patientEmail: 'paciente@test.com',
          patientName: 'Juan Pérez',
        }),
      ).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('API timeout'),
      );
    });
  });


  // ─── notifyConsentSentToPatient() ─────────────────────────────────
  describe('notifyConsentSentToPatient()', () => {
    it('registra log cuando el paciente tiene email', async () => {
      await service.notifyConsentSentToPatient({
        orderId: 'uuid-o1',
        patientEmail: 'paciente@test.com',
        patientName: 'Juan Pérez',
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('paciente@test.com'),
      );
    });

    it('registra warn y no falla cuando no hay email', async () => {
      await service.notifyConsentSentToPatient({
        orderId: 'uuid-o1',
        patientEmail: null,
        patientName: 'Juan Pérez',
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sin email para paciente'),
      );
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('retorna void sin lanzar excepciones', async () => {
      await expect(
        service.notifyConsentSentToPatient({
          orderId: 'uuid-o1',
          patientEmail: 'paciente@test.com',
          patientName: 'Juan Pérez',
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ─── notifyConsentResponded() ─────────────────────────────────────
  describe('notifyConsentResponded()', () => {
    it('registra log de respuesta ACEPTADO cuando el médico tiene email', async () => {
      await service.notifyConsentResponded({
        orderId: 'uuid-o1',
        doctorEmail: 'medico@test.com',
        patientName: 'Juan Pérez',
        response: 'ACEPTADO',
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('medico@test.com'),
      );
    });

    it('registra log de respuesta RECHAZADO cuando el médico tiene email', async () => {
      await service.notifyConsentResponded({
        orderId: 'uuid-o1',
        doctorEmail: 'medico@test.com',
        patientName: 'Juan Pérez',
        response: 'RECHAZADO',
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('medico@test.com'),
      );
    });

    it('registra warn y no falla cuando no hay email de médico', async () => {
      await service.notifyConsentResponded({
        orderId: 'uuid-o1',
        doctorEmail: null,
        patientName: 'Juan Pérez',
        response: 'ACEPTADO',
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sin email de médico'),
      );
    });
  });

  // ─── notifyAppointmentScheduled() ───────────────────────────────────
  describe('notifyAppointmentScheduled()', () => {
    const scheduledAt = new Date('2026-06-15T10:00:00Z');

    it('registra warn y no envía cuando no hay email del paciente', async () => {
      await service.notifyAppointmentScheduled({
        appointmentId: 'apt-uuid-1',
        scheduledAt,
        patientEmail: null,
        patientName: 'Juan Pérez',
      });
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Sin email para paciente'));
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('registra log cuando el paciente tiene email', async () => {
      await service.notifyAppointmentScheduled({
        appointmentId: 'apt-uuid-1',
        scheduledAt,
        patientEmail: 'paciente@test.com',
        patientName: 'Juan Pérez',
      });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('paciente@test.com'));
    });

    it('retorna void sin lanzar excepciones', async () => {
      await expect(
        service.notifyAppointmentScheduled({
          appointmentId: 'apt-uuid-1',
          scheduledAt,
          patientEmail: 'paciente@test.com',
          patientName: 'Juan Pérez',
        }),
      ).resolves.toBeUndefined();
    });
  });
});
