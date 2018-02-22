<?php

namespace AppBundle\Controller;

use AppBundle\Entity\AdminActions;
use AppBundle\Entity\Messages;
use AppBundle\Entity\Notifications;
use AppBundle\Entity\Product;
use AppBundle\Entity\Videos;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
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

        $videosToModerateCount = $this->getDoctrine()
            ->getRepository('AppBundle:Videos')
            ->createQueryBuilder('v')
            ->select('count(v)')
            ->andWhere('v.accepted = 0')
            ->getQuery()
            ->getSingleScalarResult();

        $activeUsersCount = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->where('e.enabled = 1')
            ->getQuery()
            ->getSingleScalarResult();

        $ticketsOpen = $this->getDoctrine()->getRepository('AppBundle:HelpDesk')
            ->createQueryBuilder('e')->select('e')->where('e.closed = 0')->andWhere('e.parent_m = 0')
            ->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        $ticketsOpenCount = count($ticketsOpen);

        if (!isset($_SESSION['visited'])):

            $now = $time = new \DateTime();
            $action = new AdminActions();
            $action->setLinedate($now);
            $action->setType(1);
            $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

            $em = $this->getDoctrine()->getManager();
            $em->persist($action);
            $em->flush();

        endif;
        $_SESSION['visited'] = true;


        return $this->render('admin/index.html.twig', array(
            'admin_info' => $this->getAdminInfos(),
            'adminActions' => $actions,
            'adminActionsPages' => $pages,
            'adsCount' => $adsCount,
            'videosToModerateCount' => $videosToModerateCount ?? 0,
            'activeUsersCount' => $activeUsersCount,
            'ticketsOpenCount' => $ticketsOpenCount,
            'tools' => $this
        ));
    }

    /**
     * @Route("/admin/actions/{page}", name="admin_act",  defaults={"page" = 1})
     */
    public function adminActionsAction($page)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        if ($page != 1) {
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
            ->where('e.enabled = 1')
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

        endif;
        $_SESSION['visited'] = true;


        return $this->render('admin/index.html.twig', array(
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

        return $this->render('admin/views/ads.html.twig', array(
            'admin_info' => $this->getAdminInfos(),
            'ads' => $ads,
            'tools' => $this
        ));
    }

    /**
     * @Route("/admin/payments", name="admin_payments")
     */
    public function paymentsAction()
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');
        $payments = $this->getDoctrine()
            ->getRepository('AppBundle:Payment')
            ->createQueryBuilder('p')
            ->select('p')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        foreach ($payments as $idx => $payment) {
            $payments[$idx]['username'] = $this->convertUser($payment['userId'])->getName();
            $payments[$idx]['productName'] = $this->convertProduct($payment['productId'])->getName();
        }

        return $this->render('admin/views/payments.html.twig', array(
            'admin_info' => $this->getAdminInfos(),
            'payments' => $payments,
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
            ->setParameter('id', $id)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        $video = $this->getDoctrine()
            ->getRepository('AppBundle:Videos')
            ->findOneBy(['aid' => $id]);

        return $this->render('admin/views/ads.view.html.twig', array(
            'admin_info' => $this->getAdminInfos(),
            'ad' => $ad,
            'video' => $video,
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

        return $this->render(':admin/views:users.html.twig', array(
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

        $user->setEnabled(true);
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
     * @Route("/admin/video/unaccept/{adID}", name="admin_video_unaccept")
     */
    public function unacceptVideoAction($adID)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        /** @var Videos $video */
        $video = $em->getRepository('AppBundle:Videos')->findOneBy(['aid' => $adID]);

        $video->setAccepted(false);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(10);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_vedi_inserzioni', ['id' => $adID]);
    }

    /**
     * @Route("/admin/video/accept/{adID}", name="admin_video_accept")
     */
    public function videoAcceptAction($adID)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        /** @var Videos $video */
        $video = $em->getRepository('AppBundle:Videos')->findOneBy(['aid' => $adID]);

        $video->setAccepted(true);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(9);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_vedi_inserzioni', ['id' => $adID]);
    }

    /**
     * @Route("/admin/ad/deactivate/{adID}", name="admin_ad_deactivate")
     */
    public function adDeactivateAction($adID)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $user = $em->getRepository('AppBundle:Ads')->find($adID);

        $user->setPublished(false);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(7);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_vedi_inserzioni', ['id' => $adID]);
    }

    /**
     * @Route("/admin/ad/delete/{id}", name="admin_ad_delete")
     */
    public function adDeleteAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $ad = $em->getRepository('AppBundle:Ads')->find($id);
        if ($ad) $em->remove($ad);
        $video = $em->getRepository('AppBundle:Videos')->findOneBy(['aid' => $id]);
        if ($video) $em->remove($video);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(11);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_inserzioni');
    }

    /**
     * @Route("/admin/ad/activate/{adID}", name="admin_ad_activate")
     */
    public function adActivateAction($adID)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $user = $em->getRepository('AppBundle:Ads')->find($adID);

        $user->setPublished(true);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(6);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_vedi_inserzioni', ['id' => $adID]);
    }

    /**
     * @Route("/admin/utenti/deactivate/{id}", name="admin_utenti_deactivate")
     */
    public function videoDectivateAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $user = $em->getRepository('AppBundle:User')->find($id);

        $user->setEnabled(false);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(7);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_utenti');
    }

    /**
     * @Route("/admin/utenti/delete/{id}", name="admin_utenti_delete")
     */
    public function usersDeleteAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $user = $em->getRepository('AppBundle:User')->find($id);

        $em->remove($user);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(5);
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
        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render(':admin/views:users.view.html.twig', array(
            'user' => $user,
            'admin_info' => $this->getAdminInfos()));
    }

    /**
     * @Route("/admin/video/", name="admin_video")
     */
    public function videoAction()
    {
        $videos = $this->getDoctrine()->getRepository('AppBundle:Videos')->findBy(['accepted' => 0]);

        return $this->render(':admin/views:video.mod.html.twig', array(
            'admin_info' => $this->getAdminInfos(),
            'videos' => $videos,
            'functions' => $this));
    }

    public function getAd($adID)
    {
        /** @var Ads $ads */
        $ad = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->find($adID);
        return $ad ?? null;
    }

    /**
     * @Route("/admin/video/{id}/{video_uri}", name="admin_video_view")
     * @param $video_uri
     * @return Response
     * @internal param $id
     */
    public function videoViewAction($id, $video_uri)
    {

        return $this->render(':admin/views:video.view.html.twig', array(
            'admin_info' => $this->getAdminInfos(),
            'video_uri' => $video_uri,
            'key' => $id));
    }

    /**
     * @Route("/admin/mail/", name="admin_mail")
     */
    public function mailAction(Request $request)
    {
        $default = array();
        $form = $this->createFormBuilder($default)
            ->add('type', ChoiceType::class, array(
                'choices' => array(
                    'Interna' => 'internal',
                    'E-mail' => 'email'
                )
            ))
            ->add('default', EntityType::class, array(
                    'class' => 'AppBundle:AdminDefaultMails',
                    'placeholder' => 'Non usare Messaggio predefinito',
                    'empty_data' => null,
                    'required' => null,
                    'label' => 'Messaggio Predefinito',
                    'choice_label' => 'title'
                )
            )
            ->add('to', EntityType::class, array(
                    'class' => 'AppBundle:User',
                    'placeholder' => 'Scegli User',
                    'empty_data' => null,
                    'required' => true,
                    'label' => 'Categoria',
                    'multiple' => true
                )
            )
            ->add('from', ChoiceType::class, array(
                    'choices' => array(
                        'no-reply@vedocompro.it' => 'no-reply@vedocompro.it',
                        'admin@vedocompro.it' => 'admin@vedocompro.it'
                    )
                )
            )
            ->add('subject', TextType::class)
            ->add('message', TextareaType::class, array(
                'attr' => array(
                    'class' => 'tinymce',
                    'rows' => 20
                )
            ))
            ->add('submit', SubmitType::class, array(
                'attr' => array(
                    'class' => 'btn btn-success btn-lg pull-right',
                    'label' => 'Invia'
                )
            ))
            ->getForm();

        $form->handleRequest($request);

        if ($form->isValid()) {
            /** @var User[] $to */
            $to = $form->get('to')->getData();
            $from = $form->get('from')->getData();
            $subject = $form->get('subject')->getData();
            $message_text = $form->get('message')->getData();
            $type = $form->get('type')->getData();

            if ($type == 'internal') {
                $em = $this->getDoctrine()->getManager();
                $messageTime = new \DateTime();
                foreach ($to as $user) {
                    $message = new Messages();
                    $message->setFromUID($this->getUser()->getID());
                    $message->setMessage($message_text);
                    $message->setToUID($user->getId());
                    $message->setObject(-1);
                    $message->setDatetime(new \DateTime());
                    $message->setIsRead(0);
                    $em->persist($message);
                    $em->flush();
                    $notification = new Notifications();
                    $notification->setReaded(false);
                    $notification->setObject($message->getId());
                    $notification->setType(6);
                    $notification->setUid($user->getId());
                    $notification->setDate(new \DateTime());
                    $em->persist($notification);
                    $em->flush();
                    $message = \Swift_Message::newInstance()
                        ->setSubject('Hai un nuovo messaggio!')
                        ->setFrom('noreply@vedocompro.it')
                        ->setFrom(array('noreply@vedocompro.it' => 'VedoCompro'))
                        ->setTo($user->getEmail())
                        ->setBody(
                            $this->renderView(
                                'Emails/message.notify.html.twig',
                                array(
                                    'datetime' => $messageTime->format('d/m/Y H:i:s'),
                                    'message' => $request->request->get('message'),
                                    'userFrom' => $this->getUser()->getUsername(),
                                    'userTo' => $user->getUsername()
                                )
                            ),
                            'text/html'
                        );
                    $this->get('mailer')->send($message);
                    $this->addFlash(
                        'notice',
                        sprintf("Messaggio interno inviato a %s", $user->getName())
                    );
                }
            } else if ($type == 'email') {
                foreach ($to as $user) {
                    $message = \Swift_Message::newInstance()
                        ->setSubject($subject)
                        ->setFrom($from)
                        ->setTo($user->getEmail())
                        ->setBody(
                            $this->renderView(
                                'Emails/message.blank.html.twig',
                                array('message' => $message_text, 'subject' => $subject)
                            ),
                            'text/html'
                        );
                    $this->get('mailer')->send($message);
                    $this->addFlash(
                        'notice',
                        sprintf("Email inviata a %s", $user->getName())
                    );
                }
            }

            return $this->render(':admin/views:mail.html.twig', array(
                'form' => $form->createView(),
                'success' => $success = 1,
                'admin_info' => $this->getAdminInfos()));
        }
        return $this->render(':admin/views:mail.html.twig', array(
            'form' => $form->createView(),
            'success' => $success = 0,
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

        return $this->render(':admin/views:coupons.html.twig', array(
            'admin_info' => $this->getAdminInfos(),
            'coupons' => $coupons));
    }

    /**
     * @Route("/admin/coupons/genera", name="admin_coupons_genera")
     */
    public function couponsGenAction()
    {
        return $this->render(':admin/views:coupons.generate.html.twig', array(
            'admin_info' => $this->getAdminInfos()));
    }

    /**
     * @Route("/admin/helpdesk/{show}", name="admin_helpdesk", defaults={"show" = "aperti"})
     */
    public function helpdeskAction($show)
    {
        $ticketsOpen = $this->getDoctrine()->getRepository('AppBundle:HelpDesk')
            ->createQueryBuilder('e')->select('e')->where('e.closed = 0')->andWhere('e.parent_m = 0')
            ->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        $ticketsClosed = $this->getDoctrine()->getRepository('AppBundle:HelpDesk')
            ->createQueryBuilder('e')->select('e')->where('e.closed = 1')
            ->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        $ticketsAssigned = $this->getDoctrine()->getRepository('AppBundle:HelpDesk')
            ->createQueryBuilder('e')->select('e')->where('e.closed = 2')
            ->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $countTO = count($ticketsOpen);
        $countTC = count($ticketsClosed);
        $countTA = count($ticketsAssigned);

        switch ($show) {
            default:
                $ticketsOpen = $ticketsOpen;
                break;
            case 'aperti':
                $ticketsOpen = $ticketsOpen;
                break;
            case 'chiusi':
                $ticketsOpen = $ticketsClosed;
                break;
            case 'assegnati':
                $ticketsOpen = $ticketsAssigned;
                break;
        }

        return $this->render(':admin/views:helpdesk.html.twig', array(
            'admin_info' => $this->getAdminInfos(),
            'tools' => $this,
            'ticketsOpen' => $ticketsOpen,
            'ticketsClosed' => $ticketsClosed,
            'ticketsAssigned' => $ticketsAssigned,
            'countTO' => $countTO,
            'countTC' => $countTC,
            'countTA' => $countTA));
    }

    /**
     * @Route("/admin/helpdesk/vedi/{id}/", name="helpdesk_view")
     */
    public function helpdeskViewAction($id)
    {

        $ticket = $this->getDoctrine()->getRepository('AppBundle:HelpDesk')
            ->createQueryBuilder('e')->select('e')->where('e.id = :id')->setParameter('id', $id)
            ->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $replies = $this->getDoctrine()->getManager()->getRepository('AppBundle:HelpDesk')
            ->createQueryBuilder('r')->select('r')->where('r.isReply = 1')->andWhere('r.parent_m = :id')->setParameter('id', $id)
            ->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);


        return $this->render('admin/views/helpdesk.view.html.twig', array(
            'admin_info' => $this->getAdminInfos(),
            'tools' => $this,
            'ticket' => $ticket[0],
            'replies' => $replies
        ));
    }

    /**
     * @Route("/admin/suggerimenti/", name="admin_suggerimenti")
     */
    public function suggestsAction()
    {
        $suggests = $this->getDoctrine()
            ->getRepository('AppBundle:Suggests')
            ->createQueryBuilder('e')
            ->select('e')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render(':admin/views:suggests.html.twig', array(
            'admin_info' => $this->getAdminInfos(),
            'suggests' => $suggests));
    }

    /**
     * @Route("/admin/sistema/", name="admin_sistema")
     */
    public function systemAction()
    {
        $info = array(
            'server_name' => $_SERVER['SERVER_NAME'] . ':' . $_SERVER['SERVER_PORT'],
            'server_host' => $_SERVER['HTTP_HOST'],
            'server_sftw' => $_SERVER['SERVER_SOFTWARE'],
            'php_ini' => php_ini_loaded_file(),
            'php_version' => phpversion(),
            'php_max_execution_time' => ini_get('max_execution_time'),
            'php_upload_temp_dir' => ini_get('upload_tmp_dir'),
            'php_upload_max_filesize' => ini_get('upload_max_filesize'),
            'php_post_max_size' => ini_get('post_max_size'),

        );

        return $this->render(':admin/views:system.html.twig', array(
            'admin_info' => $this->getAdminInfos(),
            'info' => $info));
    }

    /**
     * @Route("/admin/lock", name="admin_lock")
     */
    public function lockAction()
    {

        return $this->render(':admin/views:lock.html.twig', array(
            'currentUser' => $this->get('security.token_storage')->getToken()->getUser()->getID(),
            'tools' => $this
        ));
    }

    public function getAdminInfos()
    {
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
        /** @var User $user */
        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->find($userID);
        return $user;
    }

    public function convertProduct($productId)
    {
        /** @var Product $product */
        $product = $this->getDoctrine()
            ->getRepository('AppBundle:Product')
            ->find($productId);
        return $product;
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

    public function convertUname($userID)
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

    public function convertAccessType($id, $switch)
    {
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

    public function checkExt($ext)
    {
        if (strpos($ext, '.mp4') !== false) {
            return 1;
        } else {
            return 1;
        }
    }

    public function getBasename($string)
    {
        return basename($string);
    }

    public function array_fill_keys($array)
    {
        return array_fill_keys($array);
    }

    function getDirContents($dir, &$results = array())
    {
        $files = scandir($dir);

        foreach ($files as $key => $value) {
            $path = realpath($dir . DIRECTORY_SEPARATOR . $value);
            if (!is_dir($path)) {
                $results[] = $path;
            } else if ($value != "." && $value != "..") {
                $this::getDirContents($path, $results);
                $results[] = $path;
            }
        }

        return $results;
    }

    function convertHelpDeskType($type)
    {
        switch ($type) {
            case '1':
                return 'Assistenza con il sito';
                break;
            case '2':
                return 'Problema con utente';
                break;
            case '3':
                return 'Problema con un inserzione';
                break;
            case '4':
                return 'Errore generico';
                break;
            default:
                return 'Non specificato';
                break;
        }
    }

    function convertHelpDeskStatus($status)
    {
        switch ($status) {
            case '0':
                return 'Aperto';
                break;
            case '1':
                return 'Chiuso';
                break;
            case '2':
                return 'Assegnato';
                break;
            case '3':
                return 'Posticipato';
                break;
            default:
                return 'Sconosciuto';
                break;
        }
    }
}

class scanDir
{
    static private $directories, $files, $ext_filter, $recursive;

// ----------------------------------------------------------------------------------------------
    // scan(dirpath::string|array, extensions::string|array, recursive::true|false)
    static public function scan()
    {
        // Initialize defaults
        self::$recursive = false;
        self::$directories = array();
        self::$files = array();
        self::$ext_filter = false;

        // Check we have minimum parameters
        if (!$args = func_get_args()) {
            die("Must provide a path string or array of path strings");
        }
        if (gettype($args[0]) != "string" && gettype($args[0]) != "array") {
            die("Must provide a path string or array of path strings");
        }

        // Check if recursive scan | default action: no sub-directories
        if (isset($args[2]) && $args[2] == true) {
            self::$recursive = true;
        }

        // Was a filter on file extensions included? | default action: return all file types
        if (isset($args[1])) {
            if (gettype($args[1]) == "array") {
                self::$ext_filter = array_map('strtolower', $args[1]);
            } else
                if (gettype($args[1]) == "string") {
                    self::$ext_filter[] = strtolower($args[1]);
                }
        }

        // Grab path(s)
        self::verifyPaths($args[0]);
        return self::$files;
    }

    static private function verifyPaths($paths)
    {
        $path_errors = array();
        if (gettype($paths) == "string") {
            $paths = array($paths);
        }

        foreach ($paths as $path) {
            if (is_dir($path)) {
                self::$directories[] = $path;
                $dirContents = self::find_contents($path);
            } else {
                $path_errors[] = $path;
            }
        }

        if ($path_errors) {
            echo "The following directories do not exists<br />";
            die(var_dump($path_errors));
        }
    }

    // This is how we scan directories
    static private function find_contents($dir)
    {
        $result = array();
        $root = scandir($dir);
        foreach ($root as $value) {
            if ($value === '.' || $value === '..') {
                continue;
            }
            if (is_file($dir . DIRECTORY_SEPARATOR . $value)) {
                if (!self::$ext_filter || in_array(strtolower(pathinfo($dir . DIRECTORY_SEPARATOR . $value, PATHINFO_EXTENSION)), self::$ext_filter)) {
                    self::$files[] = $result[] = $dir . DIRECTORY_SEPARATOR . $value;
                }
                continue;
            }
            if (self::$recursive) {
                foreach (self::find_contents($dir . DIRECTORY_SEPARATOR . $value) as $value) {
                    self::$files[] = $result[] = $value;
                }
            }
        }
        // Return required for recursive search
        return $result;
    }
}