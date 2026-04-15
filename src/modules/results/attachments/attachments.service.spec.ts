import { BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';

const MOCK_ATTACHMENT = {
  id: 'uuid-att1',
  resultId: 'uuid-r1',
  originalName: 'informe.pdf',
  mimeType: 'application/pdf',
  size: 512 * 1024,
  filePath: 'results/uuid-r1/some-uuid.pdf',
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

const mockStorage = {
  enabled: true,
  put: jest.fn().mockResolvedValue(undefined),
  getStream: jest.fn().mockResolvedValue({ pipe: jest.fn() }),
  delete: jest.fn().mockResolvedValue(undefined),
};

const validFile = {
  fieldname: 'file',
  originalname: 'informe.pdf',
  mimetype: 'application/pdf',
  size: 512 * 1024,
  buffer: Buffer.from('fake-pdf-content'),
};

describe('AttachmentsService', () => {
  let service: AttachmentsService;

  beforeEach(() => {
    service = new AttachmentsService(mockPrisma as any, mockStorage as any);
    jest.clearAllMocks();
    mockStorage.enabled = true;
  });

  describe('upload()', () => {
    it('sube un PDF valido para un resultado existente', async () => {
      mockPrisma.result.findFirst.mockResolvedValue({ id: 'uuid-r1' });
      mockPrisma.resultAttachment.create.mockResolvedValue(MOCK_ATTACHMENT);
      const result = await service.upload('uuid-r1', validFile as any, 'lab-id');
      expect(result.mimeType).toBe('application/pdf');
      expect(mockStorage.put).toHaveBeenCalledWith(expect.stringMatching(/^results\/uuid-r1\//), validFile.buffer, 'application/pdf');
      expect(mockPrisma.resultAttachment.create).toHaveBeenCalled();
    });

    it('lanza ServiceUnavailableException si el storage no esta configurado', async () => {
      mockStorage.enabled = false;
      await expect(service.upload('uuid-r1', validFile as any, 'lab-id')).rejects.toThrow(ServiceUnavailableException);
    });

    it('rechaza archivo con mimeType no permitido', async () => {
      await expect(service.upload('uuid-r1', { ...validFile, mimetype: 'text/plain' } as any, 'lab-id')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.resultAttachment.create).not.toHaveBeenCalled();
    });

    it('rechaza archivo que supera 10 MB', async () => {
      await expect(service.upload('uuid-r1', { ...validFile, size: 11 * 1024 * 1024 } as any, 'lab-id')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.resultAttachment.create).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el resultado no existe', async () => {
      mockPrisma.result.findFirst.mockResolvedValue(null);
      await expect(service.upload('no-existe', validFile as any, 'lab-id')).rejects.toThrow(NotFoundException);
      expect(mockPrisma.resultAttachment.create).not.toHaveBeenCalled();
    });
  });

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

  describe('download()', () => {
    it('lanza NotFoundException si el adjunto no existe', async () => {
      mockPrisma.resultAttachment.findFirst.mockResolvedValue(null);
      await expect(service.download('uuid-r1', 'no-existe')).rejects.toThrow(NotFoundException);
    });

    it('retorna StreamableFile cuando el adjunto existe en R2', async () => {
      mockPrisma.resultAttachment.findFirst.mockResolvedValue(MOCK_ATTACHMENT);
      mockStorage.getStream.mockResolvedValue({ pipe: jest.fn() });
      const result = await service.download('uuid-r1', 'uuid-att1');
      expect(mockStorage.getStream).toHaveBeenCalledWith(MOCK_ATTACHMENT.filePath);
      expect(result).toBeDefined();
    });
  });

  describe('remove()', () => {
    it('hace soft-delete en DB y elimina el objeto en R2', async () => {
      mockPrisma.resultAttachment.findFirst.mockResolvedValue(MOCK_ATTACHMENT);
      mockPrisma.resultAttachment.update.mockResolvedValue({ ...MOCK_ATTACHMENT, deletedAt: new Date() });
      const result = await service.remove('uuid-r1', 'uuid-att1', 'lab-id');
      expect(result).toEqual({ id: 'uuid-att1', deleted: true });
      expect(mockPrisma.resultAttachment.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ updatedBy: 'lab-id' }) }));
      expect(mockStorage.delete).toHaveBeenCalledWith(MOCK_ATTACHMENT.filePath);
    });

    it('lanza NotFoundException si el adjunto no existe', async () => {
      mockPrisma.resultAttachment.findFirst.mockResolvedValue(null);
      await expect(service.remove('uuid-r1', 'no-existe', 'lab-id')).rejects.toThrow(NotFoundException);
    });
  });
});
