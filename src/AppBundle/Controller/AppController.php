<?php

namespace AppBundle\Controller;

use AppBundle\Entity\Category;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;


class AppController extends Controller {


    /**
     * @Route("api/app/categories/get", name="api_app_categories_get")
     */
    public function ApiAppCategoriesGet() {

        $em = $this->getDoctrine()->getManager();
        $query = $em->createQuery('SELECT a FROM AppBundle:Category a');
        $categories = $query->getArrayResult();

        $response = new Response(json_encode($categories));
        $response->headers->set('Content-Type', 'application/json');

        return $response;
    }

    /**
     * @Route("api/app/allAds/get", name="api_app_all_ads_get")
     */
    public function ApiAppAllAdsGet() {

        $em = $this->getDoctrine()->getManager();
        $query = $em->createQuery('SELECT a FROM AppBundle:Ads a ORDER BY a.id DESC');
        $ads = $query->getArrayResult();

        $response = new Response(json_encode($ads));
        $response->headers->set('Content-Type', 'application/json');

        return $response;
    }

    /**
     * @Route("api/app/Ads/get/{aid}", name="api_app_ad_get")
     */
    public function ApiAppAdGet($aid) {

        $em = $this->getDoctrine()->getManager();
        $query = $em->createQuery('SELECT a FROM AppBundle:Ads a WHERE a.id = :aid ORDER BY a.id DESC')->setParameter('aid', $aid);
        $ads = $query->getArrayResult();

        $response = new Response(json_encode($ads));
        $response->headers->set('Content-Type', 'application/json');

        return $response;
    }


    /**
     * @Route("api/app/getNotifications/{uid}", name="api_app_get_notifications")
     */
    public function ApiAppGetNotifications($uid) {
        $em = $this->getDoctrine()->getManager();
        $query = $em->createQuery("SELECT a FROM AppBundle:Notifications a ORDER BY a.id DESC");
        $notifications = $query->getArrayResult();

        $response = new Response(json_encode($notifications));
        $response->headers->set('Content-Type','application/json');

        return $response;
    }
}