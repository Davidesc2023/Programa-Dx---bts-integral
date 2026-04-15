import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  buildConsentHtml,
  PdfService,
} from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { RespondConsentDto } from './dto/respond-consent.dto';
import { SignConsentDto } from './dto/sign-consent.dto';

const CONSENT_SELECT = {
  id: true,
  orderId: true,
  status: true,
  doctorId: true,
  doctorSignedAt: true,
  doctorNameSnapshot: true,
  patientNameSnapshot: true,
  patientSignedAt: true,
  accepted: true,
  documentHtml: true,
  documentPdfUrl: true,
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
      createdAt: true,
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
      firstName: true,
      lastName: true,
    },
  },
} as const;

@Injectable()
export class ConsentsService {
  private readonly logger = new Logger(ConsentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly pdfService: PdfService,
    private readonly storageService: StorageService,
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

    // Fetch doctor details for snapshot + HTML template
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
      select: {
        firstName: true,
        lastName: true,
        specialty: true,
        medicalLicense: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException('Médico no encontrado');
    }

    // Fetch order + patient for HTML template
    const orderData = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        createdAt: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentType: true,
            documentNumber: true,
          },
        },
      },
    });

    if (!orderData) {
      throw new NotFoundException('Orden no encontrada');
    }

    const doctorName = [doctor.firstName, doctor.lastName]
      .filter(Boolean)
      .join(' ') || 'Médico';
    const patientName = `${orderData.patient.firstName} ${orderData.patient.lastName}`;
    const doctorSignedAt = new Date();

    // Build documentHtml at sign time (doctor + patient data both available)
    // patientSignedAt is a placeholder; it will be updated to true date at respond()
    const documentHtml = buildConsentHtml({
      orderId,
      orderCreatedAt: orderData.createdAt,
      patientName,
      patientDocumentType: orderData.patient.documentType,
      patientDocumentNumber: orderData.patient.documentNumber,
      doctorName,
      doctorSpecialty: doctor.specialty,
      doctorMedicalLicense: doctor.medicalLicense,
      doctorSignedAt,
      // placeholder — will be filled in once patient accepts
      patientSignedAt: doctorSignedAt,
    });

    return this.prisma.consent.update({
      where: { orderId },
      data: {
        status: 'FIRMADO_MEDICO',
        doctorId,
        doctorSignedAt,
        doctorNameSnapshot: doctorName,
        documentHtml,
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
      select: {
        id: true,
        status: true,
        deletedAt: true,
        documentHtml: true,
        doctorNameSnapshot: true,
        doctorSignedAt: true,
      },
    });

    if (!consent || consent.deletedAt) {
      throw new NotFoundException('Consentimiento no encontrado');
    }

    if (consent.status !== 'ENVIADO_PACIENTE') {
      throw new BadRequestException(
        'Solo se puede registrar respuesta de un consentimiento en estado ENVIADO_PACIENTE',
      );
    }

    const isAccepted = dto.response === 'ACEPTADO';
    const newConsentStatus = isAccepted ? 'ACEPTADO' : 'RECHAZADO';
    const newOrderStatus = isAccepted ? 'ACCEPTED' : 'RECHAZADA';
    const patientSignedAt = new Date();

    // Fetch patient name snapshot from order
    const orderData = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        createdAt: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
            documentType: true,
            documentNumber: true,
          },
        },
      },
    });

    const patientName = orderData
      ? `${orderData.patient.firstName} ${orderData.patient.lastName}`
      : 'Paciente';

    // Generate PDF and upload to R2 only if accepted
    let documentPdfUrl: string | null = null;

    if (isAccepted && consent.documentHtml) {
      try {
        // Rebuild final HTML with real patientSignedAt timestamp
        const finalHtml = orderData
          ? buildConsentHtml({
              orderId,
              orderCreatedAt: orderData.createdAt,
              patientName,
              patientDocumentType: orderData.patient.documentType,
              patientDocumentNumber: orderData.patient.documentNumber,
              doctorName: consent.doctorNameSnapshot ?? 'Médico',
              doctorSpecialty: null,
              doctorMedicalLicense: null,
              doctorSignedAt: consent.doctorSignedAt ?? new Date(),
              patientSignedAt,
            })
          : consent.documentHtml;

        const pdfBuffer = await this.pdfService.generateConsentPdf(finalHtml);
        const key = `consents/${orderId}/consent-${Date.now()}.pdf`;
        documentPdfUrl = await this.storageService.uploadBuffer(
          key,
          pdfBuffer,
          'application/pdf',
        );
      } catch (err) {
        // PDF/upload failure must not block the consent acceptance
        this.logger.error('Error generating/uploading consent PDF', err);
      }
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.consent.update({
        where: { orderId },
        data: {
          status: newConsentStatus,
          patientResponseAt: patientSignedAt,
          patientSignedAt,
          patientNameSnapshot: patientName,
          accepted: isAccepted,
          ...(documentPdfUrl ? { documentPdfUrl } : {}),
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
        patientName,
        response: newConsentStatus as 'ACEPTADO' | 'RECHAZADO',
      })
      .catch((err) =>
        this.logger.error('Error enviando notificación al médico', err),
      );

    return updated;
  }
}
