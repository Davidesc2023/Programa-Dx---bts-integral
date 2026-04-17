import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// ────────────────────────────────────────────────────────────────────────────
// StorageService — Cloudflare R2 (S3-compatible) — servicio único consolidado
//
// Variables de entorno soportadas:
//   R2_ENDPOINT          — URL completa: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
//   R2_ACCOUNT_ID        — Solo el account ID (se construye la URL automáticamente)
//   R2_ACCESS_KEY_ID     — R2 API token access key
//   R2_SECRET_ACCESS_KEY — R2 API token secret key
//   R2_BUCKET / R2_BUCKET_NAME — nombre del bucket
//   R2_PUBLIC_URL        — URL pública base para uploadBuffer() (ej. CDN o r2.dev)
// ────────────────────────────────────────────────────────────────────────────
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrl: string | null;
  readonly enabled: boolean;

  constructor() {
    const accountId       = process.env.R2_ACCOUNT_ID;
    const endpoint        = process.env.R2_ENDPOINT
      ?? (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
    const accessKeyId     = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    // Soportar ambos nombres de variable de entorno para el bucket
    const bucket          = process.env.R2_BUCKET ?? process.env.R2_BUCKET_NAME ?? 'appdx-files';
    const publicUrl       = process.env.R2_PUBLIC_URL ?? null;

    this.bucket    = bucket;
    this.publicUrl = publicUrl ? publicUrl.replace(/\/$/, '') : null;

    if (endpoint && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.enabled = true;
      this.logger.log(`StorageService inicializado → bucket: ${bucket}`);
    } else {
      this.client = null;
      this.enabled = false;
      this.logger.warn(
        'StorageService deshabilitado — faltan R2_ENDPOINT / R2_ACCOUNT_ID, R2_ACCESS_KEY_ID o R2_SECRET_ACCESS_KEY',
      );
    }
  }

  /** Sube un buffer a R2. Usado por adjuntos (no devuelve URL pública). */
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

  /**
   * Sube un buffer y devuelve su URL pública (requiere R2_PUBLIC_URL).
   * Usado por consentimientos para almacenar el PDF firmado.
   * Devuelve null si el almacenamiento no está configurado o falta R2_PUBLIC_URL.
   */
  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string | null> {
    if (!this.client || !this.publicUrl) {
      this.logger.warn(`StorageService: omitiendo uploadBuffer para key=${key}`);
      return null;
    }
    await this.put(key, buffer, contentType);
    return `${this.publicUrl}/${key}`;
  }

  /** Descarga un objeto como stream. Usado por adjuntos. */
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

  /** Elimina un objeto. Falla silenciosamente si no está configurado. */
  async delete(key: string): Promise<void> {
    if (!this.client) return;
    await this.client
      .send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
      .catch(() => null);
  }
}
