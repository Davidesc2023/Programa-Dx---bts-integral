import { Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.orderTest.create({
      data: {
        orderId,
        examCode: dto.examCode,
        examName: dto.examName,
        notes: dto.notes,
        createdBy,
      },
    });
  }

  async findByOrder(orderId: string) {
    await this.assertOrderExists(orderId);
    return this.prisma.orderTest.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
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
