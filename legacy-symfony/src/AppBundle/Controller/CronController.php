<?php
namespace AppBundle\Controller;

use AppBundle\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class CronController extends Controller {

    public function doCron() {

        $manager = $this->getDoctrine()->getManager();

        $businessCheck = $this->getDoctrine()->getRepository(User::class)->findAll();

        foreach ($businessCheck as $item) {
            if ($item->getBusinessStart() < date("now") ) {
                $item->setIsBusiness(0);
                $manager->flush();
            }
        }
    }
}