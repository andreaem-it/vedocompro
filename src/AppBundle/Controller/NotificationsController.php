<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 27/08/17
 * Time: 18:14
 */

namespace AppBundle\Controller;


use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class NotificationsController extends Controller
{
    public function NotificationAction() {
        $user = $this->get('security.token_storage')->getToken()->getUser();

        $repo = $this->getDoctrine()->getRepository('AppBundle:Notifications');

        $notifications = $repo->findBy(['uid'=> $user]);

        $count = count($notifications);

        return $this->render('notifications/notifications.menubar.html.twig',[
            'notifications' => $notifications,
            'count' => $count,
            'tools' => $this,
        ]);
    }

    public function convertNotify($int,$type) {
        switch ($int) {
            case '1':
                $icon = '';
                $text = '';
                break;
            case '2':
                $icon = 'fa fa-cogs';
                $text = 'Errore interno nel sistema notifiche';
                break;
        }

        switch ($type) {
            case 'icon':
                return $icon;
                break;
            case 'text':
                return $text;
                break;
        }
    }
}