import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { softDelete } from '../../common/helpers/soft-delete.helper';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

type OrderStatus =
  | 'PENDIENTE'
  | 'CONSENT_PENDING'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'RECHAZADA'
  | 'MUESTRA_RECOLECTADA'
  | 'EN_ANALISIS'
  | 'COMPLETADA'
  | 'CANCELADA';

type UserRole = 'ADMIN' | 'OPERADOR' | 'LABORATORIO' | 'MEDICO';

// Mapa de transiciones válidas: estado_actual → { estado_destino: roles_permitidos[] }
const TRANSITIONS: Record<string, Record<string, UserRole[]>> = {
  PENDIENTE: {
    CANCELADA: ['OPERADOR', 'ADMIN', 'MEDICO'],
  },
  // CONSENT_PENDING y ACCEPTED son gestionados por el módulo de Consentimiento
  ACCEPTED: {
    SCHEDULED: ['OPERADOR', 'LABORATORIO', 'ADMIN'],
    CANCELADA: ['OPERADOR', 'ADMIN', 'MEDICO'],
  },
  SCHEDULED: {
    MUESTRA_RECOLECTADA: ['LABORATORIO', 'ADMIN'],
    CANCELADA: ['OPERADOR', 'ADMIN', 'MEDICO'],
  },
  MUESTRA_RECOLECTADA: {
    EN_ANALISIS: ['LABORATORIO', 'ADMIN'],
    RECHAZADA: ['LABORATORIO', 'ADMIN'],
  },
  EN_ANALISIS: {
    COMPLETADA: ['LABORATORIO', 'ADMIN'],
  },
};

const ORDER_SELECT = {
  id: true,
  patientId: true,
  physician: true,
  doctorId: true,
  diagnosis: true,
  priority: true,
  observations: true,
  estimatedCompletionDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  patient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      documentType: true,
      documentNumber: true,
    },
  },
  doctor: {
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      specialty: true,
      medicalLicense: true,
    },
  },
  tests: true,
} as const;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateOrderDto, createdBy: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, deletedAt: null },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    if (dto.doctorId) {
      const doctor = await this.prisma.user.findFirst({
        where: { id: dto.doctorId, role: 'MEDICO', deletedAt: null },
        select: { id: true },
      });
      if (!doctor) {
        throw new NotFoundException('Médico no encontrado o no válido');
      }
    }

    return this.prisma.order.create({
      data: {
        patientId: dto.patientId,
        physician: dto.physician,
        doctorId: dto.doctorId,
        diagnosis: dto.diagnosis,
        priority: dto.priority,
        observations: dto.observations,
        estimatedCompletionDate: dto.estimatedCompletionDate
          ? new Date(dto.estimatedCompletionDate)
          : undefined,
        status: 'PENDIENTE',
        createdBy,
      },
      select: ORDER_SELECT,
    });
  }

  async findAll(query: FindOrdersQueryDto) {
    const { page, limit, patientId, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { deletedAt: null };
    if (patientId) where.patientId = patientId;
    if (status) where.status = status as OrderStatus;

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: ORDER_SELECT,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      select: ORDER_SELECT,
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  async update(id: string, dto: UpdateOrderDto, updatedBy: string) {
    const order = await this.findOne(id);

    if (order.status !== 'PENDIENTE') {
      throw new ConflictException(
        'Solo se pueden editar órdenes en estado PENDIENTE',
      );
    }

    const data: Prisma.OrderUpdateInput = { ...dto, updatedBy };
    if (dto.estimatedCompletionDate) {
      data.estimatedCompletionDate = new Date(dto.estimatedCompletionDate);
    }

    return this.prisma.order.update({
      where: { id },
      data,
      select: ORDER_SELECT,
    });
  }

  async updateStatus(id: string, newStatus: string, userRole: UserRole, updatedBy: string) {
    const order = await this.findOne(id);
    const currentStatus = order.status as string;

    const allowedTransitions = TRANSITIONS[currentStatus];

    if (!allowedTransitions || !allowedTransitions[newStatus]) {
      throw new UnprocessableEntityException(
        `Transición no permitida: de ${currentStatus} a ${newStatus}`,
      );
    }

    if (!allowedTransitions[newStatus].includes(userRole)) {
      throw new UnprocessableEntityException(
        `Tu rol (${userRole}) no puede ejecutar esta transición`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: newStatus as OrderStatus, updatedBy },
      select: ORDER_SELECT,
    });

    if (newStatus === 'COMPLETADA') {
      void this.dispatchResultReadyNotification(id, order);
    }

    return updated;
  }

  private async dispatchResultReadyNotification(
    orderId: string,
    order: { patient?: { firstName?: string; lastName?: string; documentNumber?: string } | null; doctor?: { email?: string | null; firstName?: string | null; lastName?: string | null } | null },
  ): Promise<void> {
    try {
      // Fetch linked patient user email if exists
      const patientLink = await this.prisma.patient.findFirst({
        where: { id: (order as any).patientId, deletedAt: null },
        select: { userId: true, firstName: true, lastName: true },
      });

      let patientEmail: string | null = null;
      if (patientLink?.userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: patientLink.userId },
          select: { email: true },
        });
        patientEmail = user?.email ?? null;
      }

      const patientName = order.patient
        ? `${order.patient.firstName ?? ''} ${order.patient.lastName ?? ''}`.trim()
        : 'Paciente';

      const doctorName = order.doctor
        ? `${order.doctor.firstName ?? ''} ${order.doctor.lastName ?? ''}`.trim()
        : 'Médico';

      await this.notifications.notifyResultReady({
        orderId,
        patientEmail,
        patientName,
        doctorEmail: order.doctor?.email ?? null,
        doctorName,
      });
    } catch (err) {
      // Non-blocking: log and ignore notification errors
    }
  }

  async remove(id: string, deletedBy: string) {
    const order = await this.findOne(id);

    if (order.status !== 'PENDIENTE') {
      throw new ConflictException(
        'Solo se pueden eliminar órdenes en estado PENDIENTE',
      );
    }

    await softDelete(this.prisma, this.prisma.order, id, 'Orden no encontrada');
    await this.prisma.order.update({
      where: { id },
      data: { updatedBy: deletedBy },
    });
  }
}
