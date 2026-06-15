import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { AppError } from './error.middleware';
import { Request } from 'express';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];

const storage = multer.memoryStorage();

function fileFilter(allowed: string[]) {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, `Invalid file type: ${file.mimetype}`));
    }
  };
}

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
});

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: fileFilter(ALLOWED_VIDEO_TYPES),
});

export function generateS3Key(originalname: string, prefix: string): string {
  const hash = crypto.randomBytes(16).toString('hex');
  const ext = path.extname(originalname).toLowerCase();
  return `${prefix}/${hash}${ext}`;
}
