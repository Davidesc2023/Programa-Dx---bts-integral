import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { softDelete } from '../../common/helpers/soft-delete.helper';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsQueryDto } from './dto/find-appointments-query.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/find-appointments-query.dto';

const APPOINTMENT_SELECT = {
  id: true,
  scheduledAt: true,
  status: true,
  notes: true,
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
  order: {
    select: {
      id: true,
      status: true,
    },
  },
} as const;

const TERMINAL_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.CANCELADA,
  AppointmentStatus.COMPLETADA,
];

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateAppointmentDto, createdBy: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    if (dto.orderId) {
      const order = await this.prisma.order.findFirst({
        where: { id: dto.orderId, deletedAt: null },
        select: { id: true },
      });
      if (!order) throw new NotFoundException('Orden no encontrada');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        orderId: dto.orderId,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes,
        createdBy,
      },
      select: APPOINTMENT_SELECT,
    });

    // Dispatch notification — fire-and-forget (no bloquear respuesta)
    this.notificationsService
      .notifyAppointmentScheduled({
        appointmentId: appointment.id,
        scheduledAt: appointment.scheduledAt,
        patientEmail: patient!.email,
        patientName: `${patient!.firstName} ${patient!.lastName}`,
      })
      .catch(() => null);

    return appointment;
  }

  async findAll(query: FindAppointmentsQueryDto) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AppointmentWhereInput = { deletedAt: null };
    if (status) where.status = status;

    const [appointments, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'asc' },
        select: APPOINTMENT_SELECT,
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return { appointments, total };
  }

  async findOne(id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, deletedAt: null },
      select: APPOINTMENT_SELECT,
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, updatedBy: string) {
    const appointment = await this.findOne(id);

    if (TERMINAL_STATUSES.includes(appointment.status)) {
      throw new ConflictException(
        'No se puede modificar una cita en estado CANCELADA o COMPLETADA',
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedBy,
      },
      select: APPOINTMENT_SELECT,
    });
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto, updatedBy: string) {
    const appointment = await this.findOne(id);

    if (TERMINAL_STATUSES.includes(appointment.status)) {
      throw new ConflictException(
        'No se puede cambiar el estado de una cita ya finalizada',
      );
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status, updatedBy },
      select: APPOINTMENT_SELECT,
    });
  }

  async remove(id: string, deletedBy: string) {
    const appointment = await this.findOne(id);

    if (TERMINAL_STATUSES.includes(appointment.status)) {
      throw new ConflictException(
        'No se puede eliminar una cita en estado CANCELADA o COMPLETADA',
      );
    }

    await softDelete(this.prisma, this.prisma.appointment, id, 'Cita no encontrada');
    await this.prisma.appointment.update({
      where: { id },
      data: { updatedBy: deletedBy },
    });
  }
}
