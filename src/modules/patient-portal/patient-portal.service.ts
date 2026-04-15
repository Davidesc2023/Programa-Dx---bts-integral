import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConsentsService } from '../consents/consents.service';
import { RespondConsentPortalDto } from './dto/respond-consent-portal.dto';

@Injectable()
export class PatientPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consentsService: ConsentsService,
  ) {}

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /** Returns Patient linked to userId, throws if no link exists */
  private async getLinkedPatient(userId: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    if (!patient) {
      throw new ForbiddenException(
        'Tu cuenta no está vinculada a un registro de paciente. Contacta al administrador.',
      );
    }

    return patient;
  }

  // ── Profile ───────────────────────────────────────────────────────────────────

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        patientProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            documentType: true,
            documentNumber: true,
            phone: true,
            email: true,
            city: true,
            address: true,
            insurance: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────────

  async getDashboard(userId: string) {
    const patient = await this.getLinkedPatient(userId);
    const patientId = patient.id;

    const [activeOrders, pendingConsents, availableResults, nextAppointment] =
      await this.prisma.$transaction([
        this.prisma.order.count({
          where: {
            patientId,
            deletedAt: null,
            status: {
              notIn: ['COMPLETADA', 'CANCELADA', 'RECHAZADA'],
            },
          },
        }),
        this.prisma.consent.count({
          where: {
            order: { patientId, deletedAt: null },
            status: 'ENVIADO_PACIENTE',
          },
        }),
        this.prisma.result.count({
          where: {
            order: { patientId, deletedAt: null },
            deletedAt: null,
          },
        }),
        this.prisma.appointment.findFirst({
          where: {
            patientId,
            deletedAt: null,
            status: { in: ['PROGRAMADA', 'CONFIRMADA'] },
            scheduledAt: { gte: new Date() },
          },
          orderBy: { scheduledAt: 'asc' },
          select: { id: true, scheduledAt: true, status: true, notes: true },
        }),
      ]);

    return { activeOrders, pendingConsents, availableResults, nextAppointment };
  }

  // ── Orders ────────────────────────────────────────────────────────────────────

  async getOrders(userId: string) {
    const patient = await this.getLinkedPatient(userId);

    return this.prisma.order.findMany({
      where: { patientId: patient.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        priority: true,
        diagnosis: true,
        observations: true,
        createdAt: true,
        updatedAt: true,
        doctor: {
          select: { id: true, firstName: true, lastName: true, specialty: true },
        },
        tests: {
          where: { deletedAt: null },
          select: { id: true, testName: true, testCode: true },
        },
        consent: { select: { id: true, status: true } },
        _count: { select: { results: true } },
      },
    });
  }

  async getOrderById(userId: string, orderId: string) {
    const patient = await this.getLinkedPatient(userId);

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, patientId: patient.id, deletedAt: null },
      select: {
        id: true,
        status: true,
        priority: true,
        diagnosis: true,
        observations: true,
        estimatedCompletionDate: true,
        createdAt: true,
        updatedAt: true,
        doctor: {
          select: {
            id: true, firstName: true, lastName: true, specialty: true, medicalLicense: true,
          },
        },
        tests: {
          where: { deletedAt: null },
          select: { id: true, testName: true, testCode: true, notes: true },
        },
        consent: {
          select: {
            id: true, status: true, doctorSignedAt: true, patientResponseAt: true, notes: true,
          },
        },
        results: {
          where: { deletedAt: null },
          select: {
            id: true, examType: true, value: true, unit: true,
            referenceRange: true, notes: true, createdAt: true,
            attachments: {
              where: { deletedAt: null },
              select: { id: true, originalName: true, mimeType: true, size: true },
            },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  // ── Consent ───────────────────────────────────────────────────────────────────

  async getConsentForOrder(userId: string, orderId: string) {
    const patient = await this.getLinkedPatient(userId);

    const consent = await this.prisma.consent.findFirst({
      where: { orderId, order: { patientId: patient.id, deletedAt: null } },
      select: {
        id: true,
        status: true,
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
        order: {
          select: {
            id: true, status: true, diagnosis: true,
            doctor: { select: { firstName: true, lastName: true, specialty: true } },
            tests: { where: { deletedAt: null }, select: { testName: true, testCode: true } },
          },
        },
      },
    });

    if (!consent) throw new NotFoundException('Consentimiento no encontrado');
    return consent;
  }

  async respondConsent(
    userId: string,
    consentId: string,
    accept: boolean,
    dto: RespondConsentPortalDto,
  ) {
    const patient = await this.getLinkedPatient(userId);

    // Verify the consent belongs to this patient before delegating
    const consent = await this.prisma.consent.findFirst({
      where: {
        id: consentId,
        order: { patientId: patient.id, deletedAt: null },
      },
      select: { id: true, orderId: true },
    });

    if (!consent) throw new NotFoundException('Consentimiento no encontrado');

    // Delegate to ConsentsService so PDF generation + R2 upload (v13) run for ACEPTADO
    return this.consentsService.respond(
      consent.orderId,
      { response: accept ? 'ACEPTADO' : 'RECHAZADO', notes: dto.notes },
      userId,
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────────

  async getResults(userId: string) {
    const patient = await this.getLinkedPatient(userId);

    return this.prisma.result.findMany({
      where: { order: { patientId: patient.id, deletedAt: null }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, examType: true, value: true, unit: true,
        referenceRange: true, notes: true, createdAt: true,
        order: { select: { id: true, status: true, diagnosis: true } },
        attachments: {
          where: { deletedAt: null },
          select: { id: true, originalName: true, mimeType: true, size: true },
        },
      },
    });
  }

  // ── Appointments ──────────────────────────────────────────────────────────────

  async getAppointments(userId: string) {
    const patient = await this.getLinkedPatient(userId);

    return this.prisma.appointment.findMany({
      where: { patientId: patient.id, deletedAt: null },
      orderBy: { scheduledAt: 'desc' },
      select: {
        id: true, scheduledAt: true, status: true, notes: true, createdAt: true,
        order: { select: { id: true, status: true, diagnosis: true } },
      },
    });
  }
}
