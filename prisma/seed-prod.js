'use strict';
// Production seed — plain JS, no ts-node required.
// Runs after prisma migrate deploy on every deployment (idempotent).

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@lab.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin1234!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    // Fix: if password was stored as plain text (does not start with bcrypt prefix)
    if (!existing.password.startsWith('$2')) {
      console.log('⚠️  Admin password is plain text — hashing it now...');
      const hashed = await bcrypt.hash(existing.password, 10);
      await prisma.user.update({
        where: { id: existing.id },
        data: { password: hashed },
      });
      console.log('✅ Admin password hashed successfully');
    } else {
      console.log(`Admin already exists with hashed password: ${adminEmail}`);
    }
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashed,
      role: 'ADMIN',
    },
  });

  console.log(`✅ Admin user created: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
