import { NotFoundException } from '@nestjs/common';
import { softDelete } from './soft-delete.helper';

const makePrismaDelegate = (record: object | null) => ({
  findFirst: jest.fn().mockResolvedValue(record),
  update: jest.fn().mockResolvedValue(undefined),
});

describe('softDelete', () => {
  it('actualiza deletedAt cuando el registro existe', async () => {
    const delegate = makePrismaDelegate({ id: '1', deletedAt: null });

    await softDelete({} as any, delegate, '1');

    expect(delegate.findFirst).toHaveBeenCalledWith({ where: { id: '1', deletedAt: null } });
    expect(delegate.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('lanza NotFoundException cuando el registro no existe o ya fue eliminado', async () => {
    const delegate = makePrismaDelegate(null);

    await expect(softDelete({} as any, delegate, '999')).rejects.toThrow(NotFoundException);
  });

  it('usa el mensaje de error personalizado', async () => {
    const delegate = makePrismaDelegate(null);

    await expect(
      softDelete({} as any, delegate, '999', 'Paciente no encontrado'),
    ).rejects.toThrow('Paciente no encontrado');
  });
});
