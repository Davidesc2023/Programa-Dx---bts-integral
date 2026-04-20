import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

// ─── Domain helpers ───────────────────────────────────────────────────────────

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── In-App CRUD ──────────────────────────────────────────────────────────────

  /** Persist an in-app notification. Fire-and-forget safe (never throws). */
  async createNotification(input: CreateNotificationInput): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          metadata: input.metadata ?? undefined,
        },
      });
    } catch (err) {
      this.logger.error(
        `[NOTIF] Error persisting notification for user ${input.userId}: ${(err as Error).message}`,
      );
    }
  }

  /** Return notifications for a user — newest first, paginated. */
  async findAll(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Lightweight unread count (used for badge polling). */
  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  /** Mark a single notification as read — verifies ownership. */
  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notificacion no encontrada');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /** Mark ALL notifications for a user as read. */
  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  // ── Domain Event Helpers ─────────────────────────────────────────────────────

  /**
   * Notify patient when a consent is sent to them.
   * Resolves Patient -> User; silently skips if patient has no linked account.
   */
  async notifyConsentSentToPatient(data: {
    orderId: string;
    patientId: string;
    patientName: string;
  }): Promise<void> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
      select: { userId: true },
    });

    if (!patient?.userId) {
      this.logger.warn(
        `[NOTIF] Paciente ${data.patientId} sin cuenta — omitiendo notificacion de consentimiento`,
      );
      return;
    }

    await this.createNotification({
      userId: patient.userId,
      type: NotificationType.CONSENT_REQUEST,
      title: 'Consentimiento pendiente',
      message: `Se ha enviado un consentimiento informado para tu orden #${data.orderId}. Revisalo y firma para continuar.`,
      metadata: { orderId: data.orderId },
    });
  }

  /** Notify doctor when the patient responds to the consent. */
  async notifyConsentResponded(data: {
    orderId: string;
    doctorId: string | null | undefined;
    patientName: string;
    response: 'ACEPTADO' | 'RECHAZADO';
  }): Promise<void> {
    if (!data.doctorId) {
      this.logger.warn(
        `[NOTIF] Orden ${data.orderId} sin medico asignado — omitiendo notificacion de respuesta`,
      );
      return;
    }

    const isAccepted = data.response === 'ACEPTADO';

    await this.createNotification({
      userId: data.doctorId,
      type: NotificationType.CONSENT_RESPONDED,
      title: isAccepted ? 'Consentimiento aceptado' : 'Consentimiento rechazado',
      message: isAccepted
        ? `${data.patientName} acepto el consentimiento de la orden #${data.orderId}. La orden puede continuar.`
        : `${data.patientName} rechazo el consentimiento de la orden #${data.orderId}. El proceso fue detenido.`,
      metadata: { orderId: data.orderId, response: data.response },
    });
  }

  /** Notify patient and doctor when results are available. */
  async notifyResultReady(data: {
    orderId: string;
    patientId: string;
    patientName: string;
    doctorId: string | null | undefined;
    doctorName: string;
  }): Promise<void> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
      select: { userId: true },
    });

    if (patient?.userId) {
      await this.createNotification({
        userId: patient.userId,
        type: NotificationType.RESULT_READY,
        title: 'Resultados disponibles',
        message: `Los resultados de tu orden #${data.orderId} ya estan listos. Puedes verlos en el portal.`,
        metadata: { orderId: data.orderId },
      });
    } else {
      this.logger.warn(
        `[NOTIF] Paciente ${data.patientId} sin cuenta — omitiendo notificacion de resultado`,
      );
    }

    if (data.doctorId) {
      await this.createNotification({
        userId: data.doctorId,
        type: NotificationType.RESULT_READY,
        title: 'Resultados cargados',
        message: `Se cargaron resultados para la orden #${data.orderId} del paciente ${data.patientName}.`,
        metadata: { orderId: data.orderId },
      });
    }
  }

  /** Notify patient when an appointment is scheduled. */
  async notifyAppointmentScheduled(data: {
    appointmentId: string;
    scheduledAt: Date;
    patientId: string;
    patientName: string;
    orderId?: string | null;
  }): Promise<void> {
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
      select: { userId: true },
    });

    if (!patient?.userId) {
      this.logger.warn(
        `[NOTIF] Paciente ${data.patientId} sin cuenta — omitiendo notificacion de cita`,
      );
      return;
    }

    const formattedDate = new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Bogota',
    }).format(data.scheduledAt);

    await this.createNotification({
      userId: patient.userId,
      type: NotificationType.APPOINTMENT_SCHEDULED,
      title: 'Cita agendada',
      message: `Se agendo una cita de laboratorio para el ${formattedDate}.`,
      metadata: {
        appointmentId: data.appointmentId,
        ...(data.orderId ? { orderId: data.orderId } : {}),
      },
    });
  }

  /** Notify patient when their order changes to a relevant status. */
  async notifyOrderUpdated(data: {
    orderId: string;
    patientId: string;
    newStatus: string;
  }): Promise<void> {
    const statusMessages: Partial<Record<string, { title: string; message: string }>> = {
      SCHEDULED: {
        title: 'Cita programada',
        message: `Tu orden #${data.orderId} fue programada para toma de muestras.`,
      },
      MUESTRA_RECOLECTADA: {
        title: 'Muestra recolectada',
        message: `La muestra de tu orden #${data.orderId} fue recolectada y esta siendo procesada.`,
      },
      EN_ANALISIS: {
        title: 'Orden en analisis',
        message: `Tu orden #${data.orderId} esta siendo analizada en el laboratorio.`,
      },
    };

    const content = statusMessages[data.newStatus];
    if (!content) return;

    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
      select: { userId: true },
    });

    if (patient?.userId) {
      await this.createNotification({
        userId: patient.userId,
        type: NotificationType.ORDER_UPDATED,
        title: content.title,
        message: content.message,
        metadata: { orderId: data.orderId, status: data.newStatus },
      });
    }
  }
}
