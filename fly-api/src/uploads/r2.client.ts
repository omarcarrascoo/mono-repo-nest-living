import { Logger } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  SignUploadInput,
  SignedUpload,
  StorageClient,
} from './storage.types';

/**
 * Cloudflare R2 (S3-compatible). Egress 100% gratis — recomendado para
 * producción cuando el free tier de Supabase ya no alcance (≥1GB/2GB egress).
 */
export class R2Client implements StorageClient {
  private readonly logger = new Logger(R2Client.name);
  private readonly s3: S3Client;
  readonly bucket: string;
  readonly publicBaseUrl: string;

  constructor() {
    const endpoint =
      process.env.R2_ENDPOINT ?? 'https://example.r2.cloudflarestorage.com';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? '';
    this.bucket = process.env.R2_BUCKET ?? 'nestquest-media';
    this.publicBaseUrl =
      process.env.R2_PUBLIC_BASE_URL ?? 'https://example.r2.dev';

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'R2 credentials missing — /uploads/sign will fail until env vars are set',
      );
    }

    this.s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }

  async signUpload(input: SignUploadInput): Promise<SignedUpload> {
    const expiresIn = input.expiresIn ?? 60 * 5;
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.key,
      ContentType: input.contentType,
      ContentLength: input.contentLength,
    });
    const uploadUrl = await getSignedUrl(this.s3, cmd, { expiresIn });
    const base = this.publicBaseUrl.replace(/\/+$/, '');
    return {
      uploadUrl,
      publicUrl: `${base}/${input.key}`,
      key: input.key,
      method: 'PUT',
      headers: { 'Content-Type': input.contentType },
      expiresIn,
    };
  }
}
