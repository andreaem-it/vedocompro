import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

const s3 = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

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
    return `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
  },

  async delete(key: string): Promise<void> {
    await s3.send(new DeleteObjectCommand({ Bucket: config.aws.bucket, Key: key }));
  },

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: config.aws.bucket, Key: key });
    return getSignedUrl(s3, command, { expiresIn });
  },

  getPublicUrl(key: string): string {
    return `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
  },
};
