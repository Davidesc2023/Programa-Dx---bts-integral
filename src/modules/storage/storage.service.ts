import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';

// ────────────────────────────────────────────────────────────────────────────
// StorageService — Cloudflare R2 (S3-compatible)
//
// Required env vars:
//   R2_ENDPOINT          — https://<ACCOUNT_ID>.r2.cloudflarestorage.com
//   R2_ACCESS_KEY_ID     — R2 API token access key
//   R2_SECRET_ACCESS_KEY — R2 API token secret key
//   R2_BUCKET            — bucket name
//   R2_PUBLIC_URL        — public base URL (e.g. https://cdn.example.com or r2.dev URL)
//
// When env vars are absent the service logs warnings and upload() resolves to null.
// ────────────────────────────────────────────────────────────────────────────
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string | null;
  private readonly publicUrl: string | null;

  constructor() {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (endpoint && accessKeyId && secretAccessKey && bucket && publicUrl) {
      this.client = new S3Client({
        endpoint,
        region: 'auto',
        credentials: { accessKeyId, secretAccessKey },
        // Cloudflare R2 requires path-style addressing
        forcePathStyle: true,
      });
      this.bucket = bucket;
      this.publicUrl = publicUrl.replace(/\/$/, '');
      this.logger.log(`StorageService configured — bucket: ${bucket}`);
    } else {
      this.client = null;
      this.bucket = null;
      this.publicUrl = null;
      this.logger.warn(
        'StorageService: R2 env vars not set — uploads will be skipped',
      );
    }
  }

  /**
   * Upload a buffer to R2 and return its public URL.
   * Returns null when storage is not configured (env vars absent).
   */
  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string | null> {
    if (!this.client || !this.bucket || !this.publicUrl) {
      this.logger.warn(`StorageService: skipping upload for key=${key}`);
      return null;
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        // Prevent public access via presigned URLs — rely on R2_PUBLIC_URL domain
        ACL: undefined,
      }),
    );

    const url = `${this.publicUrl}/${key}`;
    this.logger.log(`Uploaded ${key} → ${url}`);
    return url;
  }

  /**
   * Health check — verifies bucket is reachable.
   */
  async isHealthy(): Promise<boolean> {
    if (!this.client || !this.bucket) return false;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return true;
    } catch {
      return false;
    }
  }
}
