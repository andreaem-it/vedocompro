import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

const s3 = new S3Client({
  region: config.aws.region,
  // Endpoint custom richiesto da R2/altri provider S3-compatibili; forcePathStyle perché
  // R2 (e molti provider S3-compatibili) non supportano lo stile virtual-hosted di AWS.
  ...(config.aws.endpoint ? { endpoint: config.aws.endpoint, forcePathStyle: true } : {}),
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

// R2 non genera URL pubblici nello stile bucket.s3.region.amazonaws.com di AWS: serve la
// public URL configurata (pub-xxxx.r2.dev o dominio custom). Il fallback AWS resta per chi
// usa S3 reale senza AWS_S3_PUBLIC_URL impostata.
function buildPublicUrl(key: string): string {
  if (config.aws.publicUrl) return `${config.aws.publicUrl.replace(/\/+$/, '')}/${key}`;
  return `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
}

export const storageService = {
  async upload(key: string, buffer: Buffer, mimetype: string): Promise<string> {
    await s3.send(
      new PutObjectCommand({
        Bucket: config.aws.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }),
    );
    return buildPublicUrl(key);
  },

  async delete(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: config.aws.bucket, Key: key }));
  },

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: config.aws.bucket, Key: key });
    return getSignedUrl(s3, command, { expiresIn });
  },

  getPublicUrl(key: string): string {
    return buildPublicUrl(key);
  },

  async download(key: string): Promise<Buffer> {
    const result = await s3.send(new GetObjectCommand({ Bucket: config.aws.bucket, Key: key }));
    const bytes = await result.Body!.transformToByteArray();
    return Buffer.from(bytes);
  },

  /** Estrae la S3 key da un URL completo (es. https://bucket.s3.region.amazonaws.com/videos/xxx.mp4 -> videos/xxx.mp4). */
  extractKeyFromUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.pathname.replace(/^\/+/, '');
    } catch {
      // Non è un URL assoluto: assumiamo che sia già una key.
      return url.replace(/^\/+/, '');
    }
  },
};
