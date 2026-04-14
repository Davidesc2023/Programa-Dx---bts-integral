import { Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new NotificationsService();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
});
