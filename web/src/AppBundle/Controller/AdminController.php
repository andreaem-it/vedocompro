<?php

namespace AppBundle\Controller;

use AppBundle\Entity\AdminActions;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;
use Doctrine\ORM\QueryBuilder;
use Doctrine\ORM\EntityRepository;
use AppBundle\Entity\User;

class AdminController extends Controller
{
    /**
     * @Route("/admin", name="admin")
     */
    public function adminAction()
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');
        $page = 1;

        $actions = $this->getDoctrine()
                ->getRepository('AppBundle:AdminActions')
                ->createQueryBuilder('e')
                ->select('e')
                ->orderBy('e.linedate', 'DESC')
                ->setMaxResults('20')
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $getLines = $this->getDoctrine()
                ->getRepository('AppBundle:AdminActions')
                ->createQueryBuilder('e')
                ->select('count(e)')
                ->getQuery()
                ->getSingleScalarResult();
        $pages = ceil($getLines / 20);

        $adsCount = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->getQuery()
            ->getSingleScalarResult();

        $activeUsersCount = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->where('e.isActive = 1')
            ->getQuery()
            ->getSingleScalarResult();

            if (!isset($_SESSION['visited'])):

            $now = $time = new \DateTime();
            $action = new AdminActions();
            $action->setLinedate($now);
            $action->setType(1);
            $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

            $em = $this->getDoctrine()->getManager();
            $em->persist($action);
            $em->flush();

            endif; $_SESSION['visited'] = true;


        return $this->render('admin/index.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'adminActions' => $actions,
            'adminActionsPages' => $pages,
            'adsCount' => $adsCount,
            'activeUsersCount' => $activeUsersCount,
            'tools' => $this
    ));
    }
    /**
     * @Route("/admin/actions/{page}", name="admin_act",  defaults={"page" = 1})
     */
    public function adminActionsAction($page)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        if($page != 1){
            $results = 20 * ($page - 1);
            $actions = $this->getDoctrine()
                ->getRepository('AppBundle:AdminActions')
                ->createQueryBuilder('e')
                ->select('e')
                ->orderBy('e.linedate', 'DESC')
                ->setFirstResult($results)
                ->setMaxResults('20')
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        } else {
            $actions = $this->getDoctrine()
                ->getRepository('AppBundle:AdminActions')
                ->createQueryBuilder('e')
                ->select('e')
                ->orderBy('e.linedate', 'DESC')
                ->setMaxResults('20')
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        }
        $getLines = $this->getDoctrine()
            ->getRepository('AppBundle:AdminActions')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->getQuery()
            ->getSingleScalarResult();
        $pages = ceil($getLines / 20);

        $adsCount = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->where('e.published = 1')
            ->getQuery()
            ->getSingleScalarResult();

        $activeUsersCount = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->where('e.isActive = 1')
            ->getQuery()
            ->getSingleScalarResult();

        if (!isset($_SESSION['visited'])):

            $now = $time = new \DateTime();
            $action = new AdminActions();
            $action->setLinedate($now);
            $action->setType(1);
            $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

            $em = $this->getDoctrine()->getManager();
            $em->persist($action);
            $em->flush();

        endif; $_SESSION['visited'] = true;


        return $this->render('admin/index.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'adminActions' => $actions,
            'adminActionsPages' => $pages,
            'adsCount' => $adsCount,
            'activeUsersCount' => $activeUsersCount,
            'tools' => $this
        ));
    }
    /**
     * @Route("/admin/inserzioni", name="admin_inserzioni")
     */
    public function adsAction()
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');
        $ads = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('e')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render('admin/views/ads.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'ads' => $ads,
            'tools' => $this
        ));
    }

    /**
     * @Route("/admin/inserzioni/vedi/{id}", name="admin_vedi_inserzioni")
     */
    public function adsViewAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');
        $ad = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.id = :id')
            ->setParameter('id',$id)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render('admin/views/ads.view.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'ad' => $ad,
            'tools' => $this
        ));
    }

    /**
     * @Route("/admin/utenti/", name="admin_utenti")
     */
    public function usersAction()
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');
        $users = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render(':admin/views:users.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'users' => $users));
    }

    /**
     * @Route("/admin/utenti/activate/{id}", name="admin_utenti_activate")
     */
    public function usersActivateAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $user = $em->getRepository('AppBundle:User')->find($id);

        $user->setIsActive(1);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(2);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_utenti');
    }

    /**
     * @Route("/admin/utenti/deactivate/{id}", name="admin_utenti_deactivate")
     */
    public function usersDectivateAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $user = $em->getRepository('AppBundle:User')->find($id);

        $user->setIsActive(0);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(3);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_utenti');
    }

    /**
     * @Route("/admin/utenti/{id}", name="admin_utenti_vedi")
     */
    public function usersViewAction($id)
    {
        return $this->render(':admin/views:users.view.html.twig',array(
            'admin_info' => $this->getAdminInfos()));
    }

    /**
     * @Route("/admin/video/", name="admin_video")
     */
    public function videoAction()
    {
        $videos = array();

        return $this->render(':admin/views:video.mod.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'videos' => $videos));
    }

    /**
     * @Route("/admin/video/{id}", name="admin_video_view")
     */
    public function videoViewAction()
    {
        return $this->render(':admin/views:video.view.html.twig',array(
            'admin_info' => $this->getAdminInfos()));
    }

    /**
     * @Route("/admin/coupons/", name="admin_coupons")
     */
    public function couponsAction()
    {
        $coupons = $this->getDoctrine()
            ->getRepository('AppBundle:Coupons')
            ->createQueryBuilder('e')
            ->select('e')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render(':admin/views:coupons.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'coupons' => $coupons));
    }

    /**
     * @Route("/admin/coupons/genera", name="admin_coupons_genera")
     */
    public function couponsGenAction()
    {
        return $this->render(':admin/views:coupons.generate.html.twig',array(
            'admin_info' => $this->getAdminInfos()));
    }

    /**
     * @Route("/admin/helpdesk/", name="admin_helpdesk")
     */
    public function helpdeskAction()
    {
        return $this->render(':admin/views:helpdesk.html.twig',array(
            'admin_info' => $this->getAdminInfos()));
    }

    /**
     * @Route("/admin/sistema/", name="admin_sistema")
     */
    public function systemAction()
    {
        return $this->render(':admin/views:system.html.twig',array(
            'admin_info' => $this->getAdminInfos()));
    }

    /**
     * @Route("/admin/lock", name="admin_lock")
     */
    public function lockAction() {

        return $this->render(':admin/views:lock.html.twig',array(
            'currentUser' => $this->get('security.token_storage')->getToken()->getUser()->getID(),
            'tools' => $this
        ));
    }

    public function getAdminInfos() {
        $adminName = $this->get('security.token_storage')->getToken()->getUser();
        $admin = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.id = :adminName')
            ->setParameter(':adminName', $adminName)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        return $admin;
    }
    public function convertUser($userID)
    {
        $uname = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e.name')
            ->where('e.id = :id')
            ->setParameter('id', $userID)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        return $uname[0]["name"];
    }
    public function convertUID($userID)
    {
        $uname = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e.id')
            ->where('e.name = :name')
            ->setParameter('name', $userID)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        return $uname[0]["id"];
    }
    public function convertAds($adID)
    {
        $uname = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('e.name')
            ->where('e.id = :id')
            ->setParameter('id', $adID)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        return $uname[0]["name"];
    }
    public function convertCategory($catID)
    {
        $catname = $this->getDoctrine()
            ->getRepository('AppBundle:Category')
            ->createQueryBuilder('e')
            ->select('e.name')
            ->where('e.id = :id')
            ->setParameter('id', $catID)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        return $catname[0]["name"];
    }
    public function convertLevel($level)
    {
        switch ($level) {
            case '0':
                return 'Nessuno';
                break;
            case '1':
                return 'Oro';
                break;
            case '2':
                return 'Argento';
                break;
            case '3':
                return 'Bronzo';
                break;
            default:
                return 'Nessuno';
                break;
        }
    }
    public function convertAccessType($id,$switch) {
        $type = $this->getDoctrine()
            ->getRepository('AppBundle:AdminTypes')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        switch ($switch) {
            case 1:
                return $type[0]['name'];
                break;
            case 2:
                return $type[0]['description'];
                break;
        }

    }
    static public function slugify($text)
    {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        $text = strtolower($text);
        if (empty($text)) {
            return 'n-a';
        }
        return $text;
    }
}