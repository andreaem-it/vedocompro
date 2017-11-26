<?php

namespace AppBundle\Command;

use AppBundle\Entity\Ads;
use AppBundle\Entity\Videos;
use Gaufrette\Adapter\AwsS3;
use Gaufrette\Filesystem;
use Symfony\Bridge\Monolog\Logger;
use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Filesystem\LockHandler;

class ProcessVideoCommand extends ContainerAwareCommand
{
    /** @var Logger $logger */
    private $logger;

    protected function configure()
    {
        $this
            ->setName('app:process-videos')
            ->setDescription('...');
    }

    protected function initialize(InputInterface $input, OutputInterface $output)
    {
        $this->logger = $this->getContainer()->get('logger');

        $lockHandler = new LockHandler('app-process-videos.lock');
        if (!$lockHandler->lock()) {
            $this->logger->info('Process video command already running, so exiting');

            exit(0);
        }
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $em = $this->getContainer()->get('doctrine.orm.entity_manager');
        $videos = $em->getRepository('AppBundle:Videos')->findBy(['uploaded' => false]);
        $raw_dir = __DIR__ . "/../../../web/webtemp/rawvideos/";
        $newvideo_dir = __DIR__ . "/../../../web/webtemp/encvideos/";
        $newphoto_dir = __DIR__ . "/../../../web/webtemp/images/";

        /** @var \Gaufrette\Filesystem $fs_video */
        $fs_video = $this->getContainer()->get('knp_gaufrette.filesystem_map')->get('video_storage');
        /** @var \Gaufrette\Filesystem $fs_photo */
        $fs_photo = $this->getContainer()->get('knp_gaufrette.filesystem_map')->get('photo_storage');

        /** @var Videos $video */
        foreach ($videos as $video) {
            if ($video->getFilename() != "") {
                try {
                    $new_video_name = $video->getAid() . ".mp4";
                    $new_video_path = $newvideo_dir . $new_video_name;
                    $new_image_name = $video->getAid() . ".jpg";
                    $new_image_path = $newphoto_dir . $new_image_name;
                    $cmd = sprintf(
                        'ffmpeg -y -i %s -vf "scale=-2:720:flags=lanczos" -vcodec libx264 -profile:v main -level 3.1 -preset medium -crf 23 -x264-params ref=4 -acodec copy -movflags +faststart %s > /dev/null 2>&1',
                        $raw_dir . $video->getFilename(),
                        $new_video_path
                    );
                    exec($cmd);

                    // TODO - don't hardcode 4 seconds as if the video is shorter, this won't work
                    $cmd = sprintf(
                        'ffmpeg -i %s -an -ss 00:00:04 -r 1 -vframes 1 -f mjpeg -y %s > /dev/null 2>&1',
                        $raw_dir . $video->getFilename(),
                        $new_image_path
                    );
                    exec($cmd);

                    // Upload to S3
                    $fs_video->write($new_video_name, file_get_contents($new_video_path));
                    $fs_photo->write($new_image_name, file_get_contents($new_image_path));

                    // TODO Delete old file

                    $s3_video_link = "https://s3.eu-west-2.amazonaws.com/vedocompro/video/" . $fs_video->get($new_video_name)->getName();
                    $video->setFilename($s3_video_link);
                    $video->setUploaded(true);
                    $em->persist($video);
                    $em->flush();
                } catch (\Exception $e) {
                    $this->logger->error(
                        sprintf("Failed to process video for ad ID %d: %s\n",
                            $video->getAid(),
                            $e->getMessage()
                        )
                    );
                }
            }
        }
    }

}
