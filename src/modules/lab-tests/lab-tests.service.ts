import { Injectable, NotFoundException } from '@nestjs/common';
import { LabTestType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface CreateLabTestDto {
  code: string;
  name: string;
  type?: LabTestType;
  category?: string;
  description?: string;
  instructions?: string;
  estimatedHours?: number;
  requiresResultFromId?: string;
}

const LAB_TEST_SELECT = {
  id: true,
  code: true,
  name: true,
  type: true,
  category: true,
  description: true,
  instructions: true,
  estimatedHours: true,
  isActive: true,
  requiresResultFromId: true,
  requiresResultFrom: {
    select: { id: true, code: true, name: true, type: true },
  },
  dependentTests: {
    select: { id: true, code: true, name: true },
  },
} as const;

@Injectable()
export class LabTestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(activeOnly = true) {
    return this.prisma.labTest.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      select: LAB_TEST_SELECT,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const test = await this.prisma.labTest.findUnique({
      where: { id },
      select: LAB_TEST_SELECT,
    });
    if (!test) throw new NotFoundException('Examen no encontrado');
    return test;
  }

  async create(dto: CreateLabTestDto) {
    return this.prisma.labTest.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type ?? 'OTRO',
        category: dto.category,
        description: dto.description,
        instructions: dto.instructions,
        estimatedHours: dto.estimatedHours,
        requiresResultFromId: dto.requiresResultFromId ?? null,
      },
      select: LAB_TEST_SELECT,
    });
  }

  async update(id: string, dto: Partial<CreateLabTestDto>) {
    await this.findOne(id);
    return this.prisma.labTest.update({
      where: { id },
      data: dto,
      select: LAB_TEST_SELECT,
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.labTest.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
  }

  /**
   * Verifica si el paciente ya tiene resultado del examen prerrequisito
   * antes de permitir agregar el examen genético.
   * Retorna { unlocked: true } si puede agregarse, o { unlocked: false, requires: { id, name } }
   */
  async checkPrerequisite(labTestId: string, patientId: string) {
    const test = await this.prisma.labTest.findUnique({
      where: { id: labTestId },
      select: {
        requiresResultFrom: { select: { id: true, code: true, name: true } },
      },
    });

    if (!test) throw new NotFoundException('Examen no encontrado');
    if (!test.requiresResultFrom) return { unlocked: true, requires: null };

    // Buscar si existe alguna orden COMPLETADA del paciente que tenga un OrderTest con ese examCode
    const prereqResult = await this.prisma.orderTest.findFirst({
      where: {
        examCode: test.requiresResultFrom.code,
        order: {
          patientId,
          status: 'COMPLETADA',
        },
      },
      select: { id: true },
    });

    return {
      unlocked: Boolean(prereqResult),
      requires: test.requiresResultFrom,
    };
  }
}
