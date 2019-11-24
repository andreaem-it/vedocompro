<?php


namespace AppBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Routing\Annotation\Route;

/**
 * @Route("servizi/")
 */
class ServicesController extends Controller
{
    /**
     * @Route("/", name="route_index")
     */
    public function index() {

        return $this->render('services/index.html.twig');
    }
}