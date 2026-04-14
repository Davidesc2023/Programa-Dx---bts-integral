import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { softDelete } from '../../common/helpers/soft-delete.helper';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FindPatientsQueryDto } from './dto/find-patients-query.dto';

const PATIENT_SELECT = {
  id: true,
  documentType: true,
  documentNumber: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  phone: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
} as const;

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePatientDto, createdBy: string) {
    const existing = await this.prisma.patient.findFirst({
      where: {
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un paciente con ese tipo y número de documento',
      );
    }

    return this.prisma.patient.create({
      data: {
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        birthDate: new Date(dto.birthDate),
        phone: dto.phone,
        email: dto.email,
        createdBy,
      },
      select: PATIENT_SELECT,
    });
  }

  async findAll(query: FindPatientsQueryDto) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = { deletedAt: null };

    if (search) {
      where.OR = [
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [patients, total] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: PATIENT_SELECT,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return { patients, total };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, deletedAt: null },
      select: PATIENT_SELECT,
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, updatedBy: string) {
    await this.findOne(id);

    const data: Prisma.PatientUpdateInput = { ...dto, updatedBy };
    if (dto.birthDate) {
      data.birthDate = new Date(dto.birthDate);
    }

    return this.prisma.patient.update({
      where: { id },
      data,
      select: PATIENT_SELECT,
    });
  }

  async remove(id: string, deletedBy: string) {
    await softDelete(this.prisma, this.prisma.patient, id, 'Paciente no encontrado');
    await this.prisma.patient.update({
      where: { id },
      data: { updatedBy: deletedBy },
    });
  }
}
