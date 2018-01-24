<?php

namespace AppBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class DefaultController extends Controller
{
    /**
     * @Route("/", name="homepage")
     */
    public function indexAction(Request $request)
    {
        $usr= $this->get('security.token_storage')->getToken()->getUser();
        // replace this example code with whatever you need
        return $this->render('default/index.html.twig', [
            'base_dir' => realpath($this->getParameter('kernel.root_dir').'/..').DIRECTORY_SEPARATOR,
            'user' => $usr,
            'default' => $this
        ]);
    }

    /**
     * @Route("termini-di-servizio", name="terms-of-service")
     */
    public function tosAction(Request $request)
    {
        return $this->render(':default:terms-of-services.html.twig');
    }

    /**
     * @Route("privacy-policy", name="privacy-policy")
     */
    public function policyAction(Request $request)
    {
        return $this->render(':default:privacy.html.twig');
    }

    /**
     * @Route("linee-guida", name="guidelines")
     */
    public function guidelinesAction(Request $request)
    {
        return $this->render('default/guidelines.html.twig');
    }
}
