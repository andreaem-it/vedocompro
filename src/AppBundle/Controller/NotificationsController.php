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
use Symfony\Component\HttpFoundation\RedirectResponse;
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
     * @param Notifications $notification
     * @param string $format
     * @return string
     */
    public function convertNotifications($notification, $format) {
        $icon = '';
        $text = '';
        switch ($notification->getType()) {
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
                $message = $this->get('doctrine.orm.entity_manager')->getRepository('AppBundle:Messages')->find($notification->getObject());
                if ($message) {
                    $user = $this->get('doctrine.orm.entity_manager')->getRepository('AppBundle:User')->find($message->getFromUID());
                    $text = 'Hai un nuovo messaggio da ' . $user->getName();
                } else {
                    $text = 'Hai un nuovo messaggio';
                }
                $user = $this->get('security.token_storage')->getToken()->getUser();
                if ($msg = $notification->getObject()) $link = $this->generateUrl('profilo', ['query' => $user, 'message_id' => $msg]);
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
            case 'text':
                return $text;
            case 'link':
                return $link;
        }
    }

    /**
     * @Route("/notifications/open/{id}", name="notifications_open")
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     */
    public function openNotificationAction($id)
    {
        if (TRUE === $this->get('security.authorization_checker')->isGranted('ROLE_USER')) {
            /** @var User $user */
            $user = $this->get('security.token_storage')->getToken()->getUser();
            $em = $this->get('doctrine.orm.entity_manager');
            $notificationRepo = $em->getRepository('AppBundle:Notifications');
            /** @var Notifications $notifications */
            $notification = $notificationRepo->findOneBy(['id' => $id, 'uid' => $user->getId()]);
            if ($notification->getReaded() == false) {
                $notification->setReaded(true);
                $em->persist($notification);
            }
            $em->flush();
            if ($link = $this->convertNotifications($notification, 'link')) {
                return new RedirectResponse($link);
            } else {
                return new Response('OK');
            }
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