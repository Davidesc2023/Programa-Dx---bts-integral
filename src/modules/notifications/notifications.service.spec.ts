import { Logger, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

const MOCK_NOTIFICATION = {
  id: 'uuid-n1',
  userId: 'uuid-u1',
  type: 'CONSENT_REQUEST',
  title: 'Consentimiento pendiente',
  message: 'Mensaje',
  isRead: false,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  patient: {
    findUnique: jest.fn(),
  },
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.notification.create.mockResolvedValue(MOCK_NOTIFICATION);
    service = new NotificationsService(mockPrisma as any);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── createNotification() ─────────────────────────────────────────
  describe('createNotification()', () => {
    it('persiste una notificacion en la base de datos', async () => {
      await service.createNotification({
        userId: 'uuid-u1',
        type: 'CONSENT_REQUEST' as any,
        title: 'Titulo',
        message: 'Mensaje',
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'uuid-u1' }) }),
      );
    });

    it('no lanza excepcion si la BD falla — fire-and-forget', async () => {
      mockPrisma.notification.create.mockRejectedValueOnce(new Error('DB Error'));
      await expect(
        service.createNotification({ userId: 'x', type: 'RESULT_READY' as any, title: 'T', message: 'M' }),
      ).resolves.toBeUndefined();
    });
  });

  // ─── findAll() ────────────────────────────────────────────────────
  describe('findAll()', () => {
    it('retorna notificaciones paginadas con meta', async () => {
      mockPrisma.$transaction.mockResolvedValue([[MOCK_NOTIFICATION], 1, 0]);
      const result = await service.findAll('uuid-u1', 1, 20);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.unreadCount).toBe(0);
    });
  });

  // ─── getUnreadCount() ─────────────────────────────────────────────
  describe('getUnreadCount()', () => {
    it('retorna conteo de no leidas', async () => {
      mockPrisma.notification.count.mockResolvedValue(3);
      const result = await service.getUnreadCount('uuid-u1');
      expect(result.unreadCount).toBe(3);
    });
  });

  // ─── markRead() ───────────────────────────────────────────────────
  describe('markRead()', () => {
    it('marca una notificacion como leida', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'uuid-n1', userId: 'uuid-u1' });
      mockPrisma.notification.update.mockResolvedValue({ ...MOCK_NOTIFICATION, isRead: true });
      const result = await service.markRead('uuid-n1', 'uuid-u1');
      expect(result.isRead).toBe(true);
    });

    it('lanza NotFoundException si la notificacion no pertenece al usuario', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue({ id: 'uuid-n1', userId: 'otro-user' });
      await expect(service.markRead('uuid-n1', 'uuid-u1')).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException si no existe', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);
      await expect(service.markRead('no-existe', 'uuid-u1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── markAllRead() ────────────────────────────────────────────────
  describe('markAllRead()', () => {
    it('marca todas las notificaciones como leidas y retorna el conteo', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });
      const result = await service.markAllRead('uuid-u1');
      expect(result.updated).toBe(5);
    });
  });

  // ─── notifyConsentSentToPatient() ─────────────────────────────────
  describe('notifyConsentSentToPatient()', () => {
    it('crea notificacion cuando el paciente tiene cuenta', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: 'uuid-u1' });
      await service.notifyConsentSentToPatient({ orderId: 'uuid-o1', patientId: 'uuid-p1', patientName: 'Juan' });
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('registra warn y no crea notificacion si el paciente no tiene cuenta', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: null });
      await service.notifyConsentSentToPatient({ orderId: 'uuid-o1', patientId: 'uuid-p1', patientName: 'Juan' });
      expect(warnSpy).toHaveBeenCalled();
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('retorna void sin lanzar excepciones', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: 'uuid-u1' });
      await expect(
        service.notifyConsentSentToPatient({ orderId: 'o1', patientId: 'p1', patientName: 'X' }),
      ).resolves.toBeUndefined();
    });
  });

  // ─── notifyConsentResponded() ─────────────────────────────────────
  describe('notifyConsentResponded()', () => {
    it('crea notificacion ACEPTADO cuando hay doctorId', async () => {
      await service.notifyConsentResponded({
        orderId: 'uuid-o1',
        doctorId: 'uuid-doc1',
        patientName: 'Juan',
        response: 'ACEPTADO',
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'uuid-doc1' }) }),
      );
    });

    it('registra warn y no crea notificacion si no hay doctorId', async () => {
      await service.notifyConsentResponded({
        orderId: 'uuid-o1',
        doctorId: null,
        patientName: 'Juan',
        response: 'ACEPTADO',
      });
      expect(warnSpy).toHaveBeenCalled();
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });

  // ─── notifyResultReady() ──────────────────────────────────────────
  describe('notifyResultReady()', () => {
    it('notifica al paciente y al medico cuando ambos tienen cuenta', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: 'uuid-u1' });
      await service.notifyResultReady({
        orderId: 'uuid-o1',
        patientId: 'uuid-p1',
        patientName: 'Juan',
        doctorId: 'uuid-doc1',
        doctorName: 'Dr. García',
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
    });

    it('solo notifica al medico si el paciente no tiene cuenta', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: null });
      await service.notifyResultReady({
        orderId: 'uuid-o1',
        patientId: 'uuid-p1',
        patientName: 'Juan',
        doctorId: 'uuid-doc1',
        doctorName: 'Dr. García',
      });
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'uuid-doc1' }) }),
      );
    });

    it('no lanza excepcion si no hay medico ni cuenta de paciente', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: null });
      await expect(
        service.notifyResultReady({
          orderId: 'uuid-o1', patientId: 'uuid-p1', patientName: 'Juan',
          doctorId: null, doctorName: 'Dr.',
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ─── notifyAppointmentScheduled() ────────────────────────────────
  describe('notifyAppointmentScheduled()', () => {
    const scheduledAt = new Date('2026-06-15T10:00:00Z');

    it('crea notificacion cuando el paciente tiene cuenta', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: 'uuid-u1' });
      await service.notifyAppointmentScheduled({
        appointmentId: 'apt-1',
        scheduledAt,
        patientId: 'uuid-p1',
        patientName: 'Juan',
      });
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('registra warn y no crea notificacion si el paciente no tiene cuenta', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: null });
      await service.notifyAppointmentScheduled({
        appointmentId: 'apt-1',
        scheduledAt,
        patientId: 'uuid-p1',
        patientName: 'Juan',
      });
      expect(warnSpy).toHaveBeenCalled();
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('retorna void sin lanzar excepciones', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: 'uuid-u1' });
      await expect(
        service.notifyAppointmentScheduled({
          appointmentId: 'apt-1', scheduledAt, patientId: 'uuid-p1', patientName: 'Juan',
        }),
      ).resolves.toBeUndefined();
    });
  });

  // ─── notifyOrderUpdated() ─────────────────────────────────────────
  describe('notifyOrderUpdated()', () => {
    it('crea notificacion SCHEDULED cuando el paciente tiene cuenta', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: 'uuid-u1' });
      await service.notifyOrderUpdated({ orderId: 'uuid-o1', patientId: 'uuid-p1', newStatus: 'SCHEDULED' });
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('no crea notificacion para estados sin mensaje configurado', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: 'uuid-u1' });
      await service.notifyOrderUpdated({ orderId: 'uuid-o1', patientId: 'uuid-p1', newStatus: 'PENDIENTE' });
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('no lanza excepcion si el paciente no tiene cuenta', async () => {
      mockPrisma.patient.findUnique.mockResolvedValue({ userId: null });
      await expect(
        service.notifyOrderUpdated({ orderId: 'uuid-o1', patientId: 'uuid-p1', newStatus: 'EN_ANALISIS' }),
      ).resolves.toBeUndefined();
    });
  });
});
