import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { softDelete } from '../../common/helpers/soft-delete.helper';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

const USER_SELECT = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  documentType: true,
  documentNumber: true,
  phone: true,
  specialty: true,
  medicalLicense: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, createdBy: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
        documentType: dto.documentType as any,
        documentNumber: dto.documentNumber,
        phone: dto.phone,
        specialty: dto.specialty,
        medicalLicense: dto.medicalLicense,
        createdBy,
      },
      select: USER_SELECT,
    });
  }

  async findAll(query: FindUsersQueryDto) {
    const { page, limit, role, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (role) where.role = role as any;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, updatedBy: string) {
    await this.findOne(id);

    const { patientId, ...userFields } = dto;
    const data: Prisma.UserUpdateInput = { updatedBy };
    if (userFields.role !== undefined) data.role = userFields.role;
    if (userFields.password !== undefined) {
      data.password = await bcrypt.hash(userFields.password, 10);
    }
    if (userFields.firstName !== undefined) data.firstName = userFields.firstName;
    if (userFields.lastName !== undefined) data.lastName = userFields.lastName;
    if (userFields.documentType !== undefined) data.documentType = userFields.documentType as any;
    if (userFields.documentNumber !== undefined) data.documentNumber = userFields.documentNumber;
    if (userFields.phone !== undefined) data.phone = userFields.phone;
    if (userFields.specialty !== undefined) data.specialty = userFields.specialty;
    if (userFields.medicalLicense !== undefined) data.medicalLicense = userFields.medicalLicense;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });

    if (patientId !== undefined) {
      await this.prisma.$transaction([
        this.prisma.patient.updateMany({
          where: { userId: id },
          data: { userId: null },
        }),
        ...(patientId
          ? [this.prisma.patient.update({ where: { id: patientId }, data: { userId: id } })]
          : []),
      ]);
    }

    return updatedUser;
  }

  async remove(id: string, deletedBy: string) {
    await softDelete(this.prisma, this.prisma.user, id, 'Usuario no encontrado');
    await this.prisma.user.update({
      where: { id },
      data: { updatedBy: deletedBy },
    });
  }
}
