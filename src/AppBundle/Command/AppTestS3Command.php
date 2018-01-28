<?php

namespace AppBundle\Command;

use Symfony\Bundle\FrameworkBundle\Command\ContainerAwareCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class AppTestS3Command extends ContainerAwareCommand
{
    protected function configure()
    {
        $this
            ->setName('app:test-s3')
            ->setDescription('...')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        /** @var \Gaufrette\Filesystem $fs */
        $fs = $this->getContainer()->get('knp_gaufrette.filesystem_map')->get('video_storage');

        $file = $fs->get('42.m4v');

        echo sprintf('%s (modified %s): ', $file->getKey(), date('d/m/Y, H:i:s', $file->getMtime()) );
    }

}
