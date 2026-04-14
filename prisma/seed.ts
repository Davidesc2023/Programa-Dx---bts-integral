import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@lab.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`Usuario admin ya existe: ${adminEmail}`);
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashed,
      role: UserRole.ADMIN,
    },
  });

  console.log(`✅ Usuario admin creado: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
