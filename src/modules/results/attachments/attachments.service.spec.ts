import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';

// Mock fs/promises and fs to avoid real I/O
jest.mock('fs/promises', () => ({
  unlink: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('fs', () => ({
  createReadStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
  existsSync: jest.fn().mockReturnValue(true),
}));

const MOCK_ATTACHMENT = {
  id: 'uuid-att1',
  resultId: 'uuid-r1',
  originalName: 'informe.pdf',
  mimeType: 'application/pdf',
  size: 512 * 1024,
  filePath: 'uploads/informe.pdf',
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'lab-id',
};

const mockPrisma = {
  result: { findFirst: jest.fn() },
  resultAttachment: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

const validFile = {
  fieldname: 'file',
  originalname: 'informe.pdf',
  mimetype: 'application/pdf',
  size: 512 * 1024, // 512 KB
  path: '/tmp/informe.pdf',
  filename: 'informe.pdf',
};

describe('AttachmentsService', () => {
  let service: AttachmentsService;

  beforeEach(() => {
    service = new AttachmentsService(mockPrisma as any);
    jest.clearAllMocks();
    // Restore existsSync to default true for most tests
    const fs = require('fs');
    fs.existsSync.mockReturnValue(true);
  });

  // ─── upload() ────────────────────────────────────────────────────
  describe('upload()', () => {
    it('sube un PDF válido para un resultado existente', async () => {
      mockPrisma.result.findFirst.mockResolvedValue({ id: 'uuid-r1' });
      mockPrisma.resultAttachment.create.mockResolvedValue(MOCK_ATTACHMENT);

      const result = await service.upload('uuid-r1', validFile as any, 'lab-id');

      expect(result.mimeType).toBe('application/pdf');
      expect(mockPrisma.resultAttachment.create).toHaveBeenCalled();
    });

    it('rechaza archivo con mimeType no permitido (text/plain)', async () => {
      await expect(
        service.upload('uuid-r1', { ...validFile, mimetype: 'text/plain' } as any, 'lab-id'),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.resultAttachment.create).not.toHaveBeenCalled();
    });

    it('rechaza archivo que supera 10 MB', async () => {
      await expect(
        service.upload(
          'uuid-r1',
          { ...validFile, size: 11 * 1024 * 1024 } as any,
          'lab-id',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockPrisma.resultAttachment.create).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el resultado no existe', async () => {
      mockPrisma.result.findFirst.mockResolvedValue(null);

      await expect(
        service.upload('no-existe', validFile as any, 'lab-id'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.resultAttachment.create).not.toHaveBeenCalled();
    });
  });

  // ─── findByResult() ──────────────────────────────────────────────
  describe('findByResult()', () => {
    it('retorna lista de adjuntos de un resultado', async () => {
      mockPrisma.result.findFirst.mockResolvedValue({ id: 'uuid-r1' });
      mockPrisma.resultAttachment.findMany.mockResolvedValue([MOCK_ATTACHMENT]);

      const result = await service.findByResult('uuid-r1');

      expect(result).toHaveLength(1);
      expect(result[0].mimeType).toBe('application/pdf');
    });

    it('lanza NotFoundException si el resultado no existe', async () => {
      mockPrisma.result.findFirst.mockResolvedValue(null);

      await expect(service.findByResult('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── download() ──────────────────────────────────────────────────
  describe('download()', () => {
    it('lanza NotFoundException si el adjunto no existe', async () => {
      mockPrisma.resultAttachment.findFirst.mockResolvedValue(null);

      await expect(service.download('uuid-r1', 'no-existe')).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException si el archivo físico no existe en disco', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);
      mockPrisma.resultAttachment.findFirst.mockResolvedValue({
        ...MOCK_ATTACHMENT,
        filePath: 'uploads/missing.pdf',
        originalName: 'missing.pdf',
      });

      await expect(service.download('uuid-r1', 'uuid-att1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove() ────────────────────────────────────────────────────
  describe('remove()', () => {
    it('hace soft-delete y retorna objeto con deleted:true', async () => {
      mockPrisma.resultAttachment.findFirst.mockResolvedValue(MOCK_ATTACHMENT);
      mockPrisma.resultAttachment.update.mockResolvedValue({ ...MOCK_ATTACHMENT, deletedAt: new Date() });

      const result = await service.remove('uuid-r1', 'uuid-att1', 'lab-id');

      expect(result).toEqual({ id: 'uuid-att1', deleted: true });
      expect(mockPrisma.resultAttachment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ updatedBy: 'lab-id' }),
        }),
      );
    });

    it('lanza NotFoundException si el adjunto no existe', async () => {
      mockPrisma.resultAttachment.findFirst.mockResolvedValue(null);

      await expect(service.remove('uuid-r1', 'no-existe', 'lab-id')).rejects.toThrow(NotFoundException);
    });
  });
});
