import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { prisma } from '../lib/prisma';
import { storageService } from './storage.service';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const THUMBNAIL_COUNT = 5;

interface VideoInput {
  id: number;
  filename: string;
}

/** Legge la durata (in secondi) di un file video locale via ffprobe. */
function probeDurationSeconds(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format?.duration;
      if (!duration) return reject(new Error('Impossibile determinare la durata del video'));
      resolve(duration);
    });
  });
}

/** Transcodifica il video a 720p H.264 con faststart, come il legacy ffmpeg cron. */
function transcodeTo720p(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoFilters('scale=-2:720:flags=lanczos')
      .videoCodec('libx264')
      .outputOptions(['-profile:v main', '-level 3.1', '-preset medium', '-crf 23', '-x264-params ref=4'])
      .audioCodec('copy')
      .outputOptions(['-movflags +faststart'])
      .on('error', reject)
      .on('end', () => resolve())
      .save(outputPath);
  });
}

/** Estrae `count` thumbnail equidistanti lungo la durata del video. */
function extractThumbnails(
  inputPath: string,
  outputDir: string,
  filePrefix: string,
  count: number,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .on('error', reject)
      .on('end', () => {
        const files = Array.from({ length: count }, (_, i) => path.join(outputDir, `${filePrefix}-${i + 1}.jpg`));
        resolve(files);
      })
      .screenshots({
        count,
        filename: `${filePrefix}-%i.jpg`,
        folder: outputDir,
      });
  });
}

/**
 * Elabora un video grezzo: transcodifica a 720p, estrae 5 thumbnail, carica tutto su S3
 * e aggiorna il record Prisma. Mirror del comando legacy `app:process-videos`.
 */
export async function processVideo(video: VideoInput): Promise<void> {
  await prisma.video.update({ where: { id: video.id }, data: { processing: true } });

  const tmpDir = os.tmpdir();
  const jobId = crypto.randomBytes(8).toString('hex');
  const rawPath = path.join(tmpDir, `video-raw-${video.id}-${jobId}.mp4`);
  const transcodedPath = path.join(tmpDir, `video-720p-${video.id}-${jobId}.mp4`);
  const thumbnailPaths: string[] = [];

  try {
    const rawKey = storageService.extractKeyFromUrl(video.filename);
    const rawBuffer = await storageService.download(rawKey);
    await fs.writeFile(rawPath, rawBuffer);

    await transcodeTo720p(rawPath, transcodedPath);
    const durationSeconds = await probeDurationSeconds(transcodedPath);

    const extracted = await extractThumbnails(transcodedPath, tmpDir, `thumb-${video.id}-${jobId}`, THUMBNAIL_COUNT);
    thumbnailPaths.push(...extracted);

    const transcodedBuffer = await fs.readFile(transcodedPath);
    const videoKey = `videos/processed/${crypto.randomBytes(16).toString('hex')}.mp4`;
    const newVideoUrl = await storageService.upload(videoKey, transcodedBuffer, 'video/mp4');

    const thumbnailUrls: string[] = [];
    for (const thumbPath of thumbnailPaths) {
      const thumbBuffer = await fs.readFile(thumbPath);
      const thumbKey = `videos/thumbnails/${crypto.randomBytes(16).toString('hex')}.jpg`;
      const thumbUrl = await storageService.upload(thumbKey, thumbBuffer, 'image/jpeg');
      thumbnailUrls.push(thumbUrl);
    }

    await prisma.video.update({
      where: { id: video.id },
      data: {
        filename: newVideoUrl,
        thumbnails: thumbnailUrls,
        durationSeconds: Math.round(durationSeconds),
        uploaded: true,
      },
    });
  } finally {
    await prisma.video.update({ where: { id: video.id }, data: { processing: false } }).catch(() => undefined);

    await Promise.all(
      [rawPath, transcodedPath, ...thumbnailPaths].map((filePath) => fs.unlink(filePath).catch(() => undefined)),
    );
  }
}
