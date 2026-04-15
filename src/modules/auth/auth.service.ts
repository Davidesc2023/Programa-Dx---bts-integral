import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerPatient(dto: RegisterPatientDto): Promise<{ id: string; email: string; role: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: 'PACIENTE',
        documentType: dto.documentType as any,
        documentNumber: dto.documentNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    // Auto-link: if a Patient with same documentType+documentNumber exists, link it
    if (dto.documentType && dto.documentNumber) {
      await this.prisma.patient.updateMany({
        where: {
          documentType: dto.documentType as any,
          documentNumber: dto.documentNumber,
          userId: null,
          deletedAt: null,
        },
        data: { userId: user.id },
      });
    }

    return { id: user.id, email: user.email, role: user.role };
  }

  async register(dto: RegisterDto): Promise<{ id: string; email: string; role: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        role: dto.role,
      },
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refresh(dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    if (!stored || stored.invalidatedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Token de refresco inválido o expirado');
    }

    const payload = {
      sub: stored.userId,
      email: stored.user.email,
      role: stored.user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    return { accessToken };
  }

  async logout(dto: LogoutDto): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token: dto.refreshToken, invalidatedAt: null },
      data: { invalidatedAt: new Date() },
    });
    // Idempotente: si ya estaba invalidado, updateMany no lanza error
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
