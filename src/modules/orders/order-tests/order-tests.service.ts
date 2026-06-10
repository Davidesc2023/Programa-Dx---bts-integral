import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateOrderTestDto } from './dto/create-order-test.dto';

@Injectable()
export class OrderTestsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOrderExists(orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: { id: true },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  async create(orderId: string, dto: CreateOrderTestDto, createdBy: string) {
    await this.assertOrderExists(orderId);

    let examCode = dto.examCode;
    let examName = dto.examName;
    let labTestId = dto.labTestId ?? null;

    // Si viene labTestId, resolver código y nombre desde el catálogo
    if (dto.labTestId) {
      const labTest = await this.prisma.labTest.findUnique({
        where: { id: dto.labTestId },
        select: { id: true, code: true, name: true, isActive: true },
      });
      if (!labTest) throw new NotFoundException(`Examen del catálogo no encontrado: ${dto.labTestId}`);
      if (!labTest.isActive) throw new BadRequestException(`El examen "${labTest.name}" no está activo`);
      examCode = labTest.code;
      examName = labTest.name;
      labTestId = labTest.id;
    }

    if (!examCode || !examName) {
      throw new BadRequestException('Debe proporcionar labTestId o examCode + examName');
    }

    return this.prisma.orderTest.create({
      data: {
        orderId,
        labTestId,
        examCode,
        examName,
        notes: dto.notes,
        createdBy,
      },
      include: {
        labTest: {
          select: { id: true, code: true, name: true, type: true, category: true },
        },
      },
    });
  }

  async findByOrder(orderId: string) {
    await this.assertOrderExists(orderId);
    return this.prisma.orderTest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: {
        labTest: {
          select: { id: true, code: true, name: true, type: true, category: true, instructions: true, estimatedHours: true },
        },
      },
    });
  }

  async remove(orderId: string, testId: string) {
    await this.assertOrderExists(orderId);
    const test = await this.prisma.orderTest.findFirst({
      where: { id: testId, orderId },
    });
    if (!test) throw new NotFoundException('Examen no encontrado en esta orden');
    await this.prisma.orderTest.delete({ where: { id: testId } });
    return { message: 'Examen eliminado' };
  }
}
