import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export async function softDelete(
  prisma: PrismaService,
  delegate: { findFirst: (args: any) => Promise<any>; update: (args: any) => Promise<any> },
  id: string,
  notFoundMessage = 'El recurso no fue encontrado',
): Promise<void> {
  const record = await delegate.findFirst({ where: { id, deletedAt: null } });

  if (!record) {
    throw new NotFoundException(notFoundMessage);
  }

  await delegate.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
