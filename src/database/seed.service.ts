import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from './prisma.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedAdminUser();
  }

  private async seedAdminUser(): Promise<void> {
    const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@lab.local';
    const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      this.logger.log(`Admin user already exists: ${email}`);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    await this.prisma.user.create({
      data: { email, password: hashed, role: UserRole.ADMIN },
    });
    this.logger.log(`✅ Admin user created: ${email}`);
  }
}
