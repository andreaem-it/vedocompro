<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 27/08/17
 * Time: 18:14
 */

namespace AppBundle\Controller;


use AppBundle\Entity\Notifications;
use AppBundle\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use JMS\SecurityExtraBundle\Annotation\Secure;
use Symfony\Component\HttpFoundation\Response;


class NotificationsController extends Controller
{
    public function notificationsAction() {
        $user = $this->get('security.token_storage')->getToken()->getUser();

        $repo = $this->getDoctrine()->getRepository('AppBundle:Notifications');

        $notifications = $repo->findBy(['uid'=> $user, 'readed' => false]);

        $count = count($notifications);

        return $this->render('notifications/notifications.menubar.html.twig',[
            'notifications' => $notifications,
            'count' => $count,
            'tools' => $this,
        ]);
    }

    /**
     * @param $type
     * @return string
     */
    public function convertNotifications($type, $format, $routeParam = null) {
        $icon = '';
        $text = '';
        switch ($type) {
            case 1:
                $text =  'Il tuo annuncio è stato approvato';
                break;
            case 2:
                $text =  'Il tuo annuncio è stato rifiutato';
                break;
            case 3:
                $text =  'Il tuo annuncio non è stato approvato';
                break;
            case 4:
                $text =  '';
                break;
            case 5:
                $text =  '';
                break;
            case 6:
                $text =  'Hai un nuovo messaggio';
                if ($routeParam != null) $link = $this->generateUrl('message', ['id' => $routeParam]);
                break;
            case 7:
                $text =  'Hai ricevuto un feedback';
                break;
            case 8:
                $text =  'Devi lasciare un feedback';
                break;
            case 9:
                $text =  '';
                break;
            case 10:
                $text =  'Il tuo annuncio Oro sta scadendo';
                break;
            case 11:
                $text =  'Il tuo annuncio Argento sta scadendo';
                break;
            case 12:
                $text =  'Il tuo anuncio Bronzo sta scadendo';

        }
        switch ($format) {
            case 'icon':
                return $icon;
                break;
            case 'text':
                return $text;
                break;
            case 'link':
                return $link;
                break;
        }
    }

    /**
     * @Route("/notifications/mark-read", name="notifications_mark_read")
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     */
    public function markNotificationsReadAction()
    {
        if (TRUE === $this->get('security.authorization_checker')->isGranted('ROLE_USER')) {
            /** @var User $user */
            $user = $this->get('security.token_storage')->getToken()->getUser();
            $em = $this->get('doctrine.orm.entity_manager');
            $notificationRepo = $em->getRepository('AppBundle:Notifications');
            /** @var Notifications $notifications */
            $notifications = $notificationRepo->findBy(['uid' => $user->getId()]);
            foreach($notifications as $notification) {
                if ($notification->getReaded() == false) {
                    $notification->setReaded(true);
                    $em->persist($notification);
                }
            }
            $em->flush();
            return new Response("OK");
        } else {
            return $this->redirectToRoute('login');
        }
    }

    /**
     * @Route("/notifications/{id}", name="notification", requirements={"id"="\d+"})
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     */
    public function notificationAction($id)
    {
        if (TRUE === $this->get('security.authorization_checker')->isGranted('ROLE_USER')) {
            /** @var User $user */
            $user = $this->get('security.token_storage')->getToken()->getUser();
            $em = $this->get('doctrine.orm.entity_manager');
            $notificationRepo = $em->getRepository('AppBundle:Notifications');
            $notification = $notificationRepo->findOneBy(['uid' => $user->getId(), 'id' => $id]);
            if ($notification && $notification->getReaded() == false) {
                $notification->setReaded(true);
                $em->persist($notification);
                $em->flush();
            }
            return $this->render('notifications/notification.html.twig',[
                'notification' => $notification
            ]);
        } else {
            return $this->redirectToRoute('login');
        }
    }
}