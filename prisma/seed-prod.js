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
    // Always re-hash and sync the password from env var on every deploy.
    // This guarantees the admin password matches SEED_ADMIN_PASSWORD after any redeploy.
    const hashed = await bcrypt.hash(adminPassword, 10);
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: hashed },
    });
    console.log(`✅ Admin password synced: ${adminEmail}`);
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
    // Log the error but do NOT exit with 1 — the main app must always start.
    console.error('[SEED] Error during seed (non-fatal):', e?.message ?? e);
  })
  .finally(() => prisma.$disconnect());
