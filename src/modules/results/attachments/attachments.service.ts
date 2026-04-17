import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  StreamableFile,
} from '@nestjs/common';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../database/prisma.service';
import { StorageService } from '../../../common/storage/storage.service';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(
    resultId: string,
    file: UploadedFile,
    createdBy: string,
  ) {
    if (!this.storage.enabled) {
      throw new ServiceUnavailableException(
        'Almacenamiento no configurado en este entorno. Configure las variables R2_*.',
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de archivo no permitido. Solo PDF, JPG, PNG y WEBP.',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('El archivo supera el límite de 10 MB.');
    }

    const result = await this.prisma.result.findFirst({
      where: { id: resultId, deletedAt: null },
      select: { id: true },
    });

    if (!result) {
      throw new NotFoundException('Resultado no encontrado');
    }

    const key = `results/${resultId}/${randomUUID()}${extname(file.originalname)}`;
    await this.storage.put(key, file.buffer, file.mimetype);

    return this.prisma.resultAttachment.create({
      data: {
        resultId,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        filePath: key,
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

  async download(
    resultId: string,
    attachmentId: string,
    requestingUserId: string,
    requestingUserRole: string,
  ): Promise<StreamableFile> {
    const attachment = await this.prisma.resultAttachment.findFirst({
      where: { id: attachmentId, resultId, deletedAt: null },
      include: {
        result: {
          select: {
            orderId: true,
            order: {
              select: {
                patientId: true,
                doctorId: true,
                patient: { select: { userId: true } },
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Adjunto no encontrado');
    }

    // PACIENTE solo puede acceder a sus propios adjuntos
    if (requestingUserRole === 'PACIENTE') {
      const patientUserId = attachment.result?.order?.patient?.userId;
      if (!patientUserId || patientUserId !== requestingUserId) {
        throw new NotFoundException('Adjunto no encontrado');
      }
    }

    const stream = await this.storage.getStream(attachment.filePath);
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

    await this.storage.delete(attachment.filePath);

    return { id: attachmentId, deleted: true };
  }
}
