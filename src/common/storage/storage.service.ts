import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  readonly enabled: boolean;

  constructor() {
    const accountId      = process.env.R2_ACCOUNT_ID;
    const accessKeyId    = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket         = process.env.R2_BUCKET_NAME ?? 'appdx-attachments';

    this.bucket = bucket;

    if (accountId && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.enabled = true;
      this.logger.log(`StorageService inicializado → R2 bucket: ${bucket}`);
    } else {
      this.client = null;
      this.enabled = false;
      this.logger.warn(
        'StorageService deshabilitado — faltan variables R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY',
      );
    }
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    if (!this.client) {
      throw new Error('StorageService no configurado: faltan variables R2_*');
    }
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getStream(key: string): Promise<Readable> {
    if (!this.client) {
      throw new Error('StorageService no configurado');
    }
    const { Body } = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!Body) throw new Error('Respuesta vacía desde R2');
    return Body as Readable;
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
      .catch(() => null);
  }
}
