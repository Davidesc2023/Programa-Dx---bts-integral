import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { softDelete } from '../../common/helpers/soft-delete.helper';
import { CreateResultDto } from './dto/create-result.dto';
import { FindResultsQueryDto } from './dto/find-results-query.dto';
import { UpdateResultDto } from './dto/update-result.dto';

const RESULT_SELECT = {
  id: true,
  orderId: true,
  examType: true,
  value: true,
  unit: true,
  referenceRange: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  order: {
    select: {
      id: true,
      status: true,
      patientId: true,
    },
  },
} as const;

const EDITABLE_STATUSES = ['EN_ANALISIS', 'COMPLETADA'];

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateResultDto, createdBy: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    if (!EDITABLE_STATUSES.includes(order.status)) {
      throw new ConflictException(
        'Solo se pueden agregar resultados a órdenes en estado EN_ANALISIS o COMPLETADA',
      );
    }

    return this.prisma.result.create({
      data: {
        orderId: dto.orderId,
        examType: dto.examType,
        value: dto.value,
        unit: dto.unit,
        referenceRange: dto.referenceRange,
        notes: dto.notes,
        createdBy,
      },
      select: RESULT_SELECT,
    });
  }

  async findAll(query: FindResultsQueryDto) {
    const { page, limit, orderId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ResultWhereInput = { deletedAt: null };
    if (orderId) where.orderId = orderId;

    const [results, total] = await this.prisma.$transaction([
      this.prisma.result.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: RESULT_SELECT,
      }),
      this.prisma.result.count({ where }),
    ]);

    return { results, total };
  }

  async findOne(id: string) {
    const result = await this.prisma.result.findFirst({
      where: { id, deletedAt: null },
      select: RESULT_SELECT,
    });

    if (!result) {
      throw new NotFoundException('Resultado no encontrado');
    }

    return result;
  }

  async update(id: string, dto: UpdateResultDto, updatedBy: string) {
    const result = await this.findOne(id);

    if (!EDITABLE_STATUSES.includes(result.order.status)) {
      throw new ConflictException(
        'Solo se pueden editar resultados de órdenes en estado EN_ANALISIS o COMPLETADA',
      );
    }

    return this.prisma.result.update({
      where: { id },
      data: { ...dto, updatedBy },
      select: RESULT_SELECT,
    });
  }

  async remove(id: string, deletedBy: string) {
    await softDelete(this.prisma, this.prisma.result, id, 'Resultado no encontrado');
    await this.prisma.result.update({
      where: { id },
      data: { updatedBy: deletedBy },
    });
  }
}
