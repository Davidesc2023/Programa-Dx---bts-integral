import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { RespondConsentDto } from './dto/respond-consent.dto';
import { SignConsentDto } from './dto/sign-consent.dto';

const CONSENT_SELECT = {
  id: true,
  orderId: true,
  status: true,
  doctorId: true,
  doctorSignedAt: true,
  patientResponseAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  order: {
    select: {
      id: true,
      status: true,
      physician: true,
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          documentType: true,
          documentNumber: true,
          email: true,
        },
      },
    },
  },
  doctor: {
    select: {
      id: true,
      email: true,
      role: true,
    },
  },
} as const;

@Injectable()
export class ConsentsService {
  private readonly logger = new Logger(ConsentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(orderId: string, dto: CreateConsentDto, createdBy: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (order.status !== 'PENDIENTE') {
      throw new BadRequestException(
        'Solo se puede crear un consentimiento para órdenes en estado PENDIENTE',
      );
    }

    const existing = await this.prisma.consent.findUnique({
      where: { orderId },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Ya existe un consentimiento para esta orden');
    }

    const [consent] = await this.prisma.$transaction([
      this.prisma.consent.create({
        data: {
          orderId,
          notes: dto.notes,
          createdBy,
          updatedBy: createdBy,
        },
        select: CONSENT_SELECT,
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'CONSENT_PENDING', updatedBy: createdBy },
      }),
    ]);

    return consent;
  }

  async findByOrder(orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: { id: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    const consent = await this.prisma.consent.findUnique({
      where: { orderId },
      select: CONSENT_SELECT,
    });

    if (!consent) {
      throw new NotFoundException('Esta orden no tiene consentimiento');
    }

    return consent;
  }

  async sign(orderId: string, dto: SignConsentDto, doctorId: string) {
    const consent = await this.prisma.consent.findUnique({
      where: { orderId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!consent || consent.deletedAt) {
      throw new NotFoundException('Consentimiento no encontrado');
    }

    if (consent.status !== 'PENDIENTE_FIRMA_MEDICO') {
      throw new BadRequestException(
        'Solo se puede firmar un consentimiento en estado PENDIENTE_FIRMA_MEDICO',
      );
    }

    return this.prisma.consent.update({
      where: { orderId },
      data: {
        status: 'FIRMADO_MEDICO',
        doctorId,
        doctorSignedAt: new Date(),
        notes: dto.notes ?? undefined,
        updatedBy: doctorId,
      },
      select: CONSENT_SELECT,
    });
  }

  async send(orderId: string, updatedBy: string) {
    const consent = await this.prisma.consent.findUnique({
      where: { orderId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!consent || consent.deletedAt) {
      throw new NotFoundException('Consentimiento no encontrado');
    }

    if (consent.status !== 'FIRMADO_MEDICO') {
      throw new BadRequestException(
        'Solo se puede enviar al paciente un consentimiento en estado FIRMADO_MEDICO',
      );
    }

    const result = await this.prisma.consent.update({
      where: { orderId },
      data: {
        status: 'ENVIADO_PACIENTE',
        updatedBy,
      },
      select: CONSENT_SELECT,
    });

    void this.notifications
      .notifyConsentSentToPatient({
        orderId,
        patientEmail: result.order.patient.email,
        patientName: `${result.order.patient.firstName} ${result.order.patient.lastName}`,
      })
      .catch((err) =>
        this.logger.error('Error enviando notificación al paciente', err),
      );

    return result;
  }

  async respond(orderId: string, dto: RespondConsentDto, updatedBy: string) {
    const consent = await this.prisma.consent.findUnique({
      where: { orderId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!consent || consent.deletedAt) {
      throw new NotFoundException('Consentimiento no encontrado');
    }

    if (consent.status !== 'ENVIADO_PACIENTE') {
      throw new BadRequestException(
        'Solo se puede registrar respuesta de un consentimiento en estado ENVIADO_PACIENTE',
      );
    }

    const newConsentStatus =
      dto.response === 'ACEPTADO' ? 'ACEPTADO' : 'RECHAZADO';
    const newOrderStatus =
      dto.response === 'ACEPTADO' ? 'ACCEPTED' : 'RECHAZADA';

    const [updated] = await this.prisma.$transaction([
      this.prisma.consent.update({
        where: { orderId },
        data: {
          status: newConsentStatus,
          patientResponseAt: new Date(),
          updatedBy,
        },
        select: CONSENT_SELECT,
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: newOrderStatus, updatedBy },
      }),
    ]);

    void this.notifications
      .notifyConsentResponded({
        orderId,
        doctorEmail: updated.doctor?.email ?? null,
        patientName: `${updated.order.patient.firstName} ${updated.order.patient.lastName}`,
        response: newConsentStatus as 'ACEPTADO' | 'RECHAZADO',
      })
      .catch((err) =>
        this.logger.error('Error enviando notificación al médico', err),
      );

    return updated;
  }
}
