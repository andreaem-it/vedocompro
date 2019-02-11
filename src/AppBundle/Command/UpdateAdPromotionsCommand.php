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

class UpdateAdPromotionsCommand extends ContainerAwareCommand
{
    /** @var Logger $logger */
    private $logger;

    protected function configure()
    {
        $this
            ->setName('app:update-ad-promotions');
    }

    protected function initialize(InputInterface $input, OutputInterface $output)
    {
        $this->logger = $this->getContainer()->get('logger');

        $lockHandler = new LockHandler('update-ad-promotions.lock');
        if (!$lockHandler->lock()) {
            $this->logger->info('Process video command already running, so exiting');

            exit(0);
        }
    }

    protected function execute(InputInterface $input, OutputInterface $output)
    {
        $em = $this->getContainer()->get('doctrine.orm.entity_manager');
        $ads = $em->getRepository('AppBundle:Ads')->findBy(['showcase' => true]);
        $now = new \DateTime();
        foreach($ads as $ad) {
            if ($ad->getGoldPromotionEndDate() != null && $ad->getGoldPromotionEndDate() < $now) {
                $ad->setGoldPromotionEndDate(null);
            }
            if ($ad->getSilverPromotionEndDate() != null && $ad->getSilverPromotionEndDate() < $now) {
                $ad->setSilverPromotionEndDate(null);
            }
            if ($ad->getBronzePromotionEndDate() != null && $ad->getBronzePromotionEndDate() < $now) {
                $ad->setBronzePromotionEndDate(null);
            }

            if ($ad->getGoldPromotionEndDate() == null
                && $ad->getSilverPromotionEndDate() == null
                && $ad->getBronzePromotionEndDate() == null
            ) {
                $ad->setShowcase(0);
            }
            $em->persist($ad);
        }
        $em->flush();
    }
}
