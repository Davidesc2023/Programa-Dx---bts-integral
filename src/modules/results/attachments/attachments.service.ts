import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../../database/prisma.service';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  filename: string;
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ATTACHMENT_SELECT = {
  id: true,
  resultId: true,
  originalName: true,
  mimeType: true,
  size: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
} as const;

@Injectable()
export class AttachmentsService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(private readonly prisma: PrismaService) {}

  async upload(
    resultId: string,
    file: UploadedFile,
    createdBy: string,
  ) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      await unlink(file.path).catch(() => null);
      throw new BadRequestException(
        'Tipo de archivo no permitido. Solo PDF, JPG, PNG y WEBP.',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      await unlink(file.path).catch(() => null);
      throw new BadRequestException('El archivo supera el límite de 10 MB.');
    }

    const result = await this.prisma.result.findFirst({
      where: { id: resultId, deletedAt: null },
      select: { id: true },
    });

    if (!result) {
      await unlink(file.path).catch(() => null);
      throw new NotFoundException('Resultado no encontrado');
    }

    const relativePath = join('uploads', file.filename);

    return this.prisma.resultAttachment.create({
      data: {
        resultId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        filePath: relativePath,
        createdBy,
        updatedBy: createdBy,
      },
      select: ATTACHMENT_SELECT,
    });
  }

  async findByResult(resultId: string) {
    const result = await this.prisma.result.findFirst({
      where: { id: resultId, deletedAt: null },
      select: { id: true },
    });

    if (!result) {
      throw new NotFoundException('Resultado no encontrado');
    }

    return this.prisma.resultAttachment.findMany({
      where: { resultId, deletedAt: null },
      select: ATTACHMENT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async download(resultId: string, attachmentId: string): Promise<StreamableFile> {
    const attachment = await this.prisma.resultAttachment.findFirst({
      where: { id: attachmentId, resultId, deletedAt: null },
    });

    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    const absolutePath = join(process.cwd(), attachment.filePath);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Archivo no encontrado en el servidor');
    }

    const stream = createReadStream(absolutePath);
    return new StreamableFile(stream, {
      type: attachment.mimeType,
      disposition: `attachment; filename="${attachment.originalName}"`,
    });
  }

  async remove(resultId: string, attachmentId: string, deletedBy: string) {
    const attachment = await this.prisma.resultAttachment.findFirst({
      where: { id: attachmentId, resultId, deletedAt: null },
    });

    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    await this.prisma.resultAttachment.update({
      where: { id: attachmentId },
      data: { deletedAt: new Date(), updatedBy: deletedBy },
    });

    // Best-effort physical deletion
    const absolutePath = join(process.cwd(), attachment.filePath);
    await unlink(absolutePath).catch(() => null);

    return { id: attachmentId, deleted: true };
  }

  async ensureUploadDir(): Promise<void> {
    await mkdir(this.uploadDir, { recursive: true });
  }
}
