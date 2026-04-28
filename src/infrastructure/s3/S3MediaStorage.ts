import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import {
  MediaStorage,
  PresignUploadInput,
  PresignedUpload,
} from '@/application/ports/MediaStorage';
import { randomToken } from '@/shared/uuid';

interface S3Config {
  bucket: string;
  region: string;
  publicBaseUrl: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * AWS S3 adapter using presigned PUT URLs.
 *
 * Env vars are read lazily (on each call) so editing `.env.local` while the
 * dev server is up takes effect after the next HMR cycle — no need to keep
 * restarting just to pick up credentials.
 */
export class S3MediaStorage implements MediaStorage {
  private client: S3Client | null = null;
  private clientFor: { region: string; key?: string } | null = null;

  private readConfig(): S3Config {
    const bucket = process.env.AWS_S3_BUCKET ?? '';
    const region = process.env.AWS_REGION ?? '';
    const publicBaseUrl =
      process.env.S3_PUBLIC_BASE_URL ??
      (bucket && region ? `https://${bucket}.s3.${region}.amazonaws.com` : '');
    return {
      bucket,
      region,
      publicBaseUrl,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  private getClient(cfg: S3Config): S3Client {
    // Reuse client when region+key haven't changed across calls.
    const cacheKey = { region: cfg.region, key: cfg.accessKeyId };
    if (
      this.client &&
      this.clientFor?.region === cacheKey.region &&
      this.clientFor?.key === cacheKey.key
    ) {
      return this.client;
    }
    this.client = new S3Client({
      region: cfg.region || undefined,
      credentials:
        cfg.accessKeyId && cfg.secretAccessKey
          ? { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey }
          : undefined,
    });
    this.clientFor = cacheKey;
    return this.client;
  }

  private assertConfigured(cfg: S3Config) {
    if (!cfg.bucket || !cfg.region) {
      throw new Error(
        'S3 não configurado. Confira AWS_S3_BUCKET, AWS_REGION (e AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY) no .env.local e reinicie pnpm dev.',
      );
    }
  }

  async presignUpload(input: PresignUploadInput): Promise<PresignedUpload> {
    const cfg = this.readConfig();
    this.assertConfigured(cfg);
    if (!input.contentType.startsWith('image/')) {
      throw new Error(`Refusing to presign non-image content type: ${input.contentType}`);
    }
    const ext =
      input.extension?.replace(/^\.+/, '') ||
      input.contentType.split('/')[1]?.split('+')[0] ||
      'bin';
    const key = `media/${new Date().getFullYear()}/${randomToken(12)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.sizeBytes,
    });

    const uploadUrl = await getSignedUrl(this.getClient(cfg), command, { expiresIn: 60 * 5 });
    const publicUrl = `${cfg.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    return { uploadUrl, publicUrl };
  }

  async delete(publicUrl: string): Promise<void> {
    const cfg = this.readConfig();
    if (!cfg.bucket) return;
    try {
      const url = new URL(publicUrl);
      const key = url.pathname.replace(/^\//, '');
      if (!key) return;
      await this.getClient(cfg).send(
        new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }),
      );
    } catch {
      // best-effort
    }
  }
}
