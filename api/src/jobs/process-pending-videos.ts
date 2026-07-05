import { prisma } from '../lib/prisma';
import { processVideo } from '../services/video-processing.service';

interface ProcessPendingVideosResult {
  processed: number[];
  failed: number[];
}

/** Batch limitato di default: i piani serverless Vercel hanno timeout 10-60s e la transcodifica video è lenta. */
export async function processPendingVideos(limit = 2): Promise<ProcessPendingVideosResult> {
  const videos = await prisma.video.findMany({
    where: { uploaded: false, processing: false },
    take: limit,
  });

  const processed: number[] = [];
  const failed: number[] = [];

  for (const video of videos) {
    try {
      await processVideo(video);
      processed.push(video.id);
    } catch (err) {
      console.error(`Failed to process video ID ${video.id}:`, err);
      failed.push(video.id);
    }
  }

  return { processed, failed };
}
