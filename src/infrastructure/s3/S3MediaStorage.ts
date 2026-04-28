import {
  MediaStorage,
  PresignUploadInput,
  PresignedUpload,
} from '@/application/ports/MediaStorage';
import { randomToken } from '@/shared/uuid';

// AWS SDK is loaded lazily inside the methods so importing this module is
// cheap. That keeps routes that never touch S3 (most of the app) from
// dragging the SDK into their bundle / cold start.
type S3ClientCtor = typeof import('@aws-sdk/client-s3').S3Client;
type S3ClientInstance = InstanceType<S3ClientCtor>;

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
  private client: S3ClientInstance | null = null;
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

  private async getClient(cfg: S3Config): Promise<S3ClientInstance> {
    const cacheKey = { region: cfg.region, key: cfg.accessKeyId };
    if (
      this.client &&
      this.clientFor?.region === cacheKey.region &&
      this.clientFor?.key === cacheKey.key
    ) {
      return this.client;
    }
    const { S3Client } = await import('@aws-sdk/client-s3');
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

    const [{ PutObjectCommand }, { getSignedUrl }] = await Promise.all([
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner'),
    ]);

    const command = new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      ContentType: input.contentType,
      ContentLength: input.sizeBytes,
    });

    const client = await this.getClient(cfg);
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 * 5 });
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
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await this.getClient(cfg);
      await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }));
    } catch {
      // best-effort
    }
  }
}
