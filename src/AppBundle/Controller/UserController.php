<?php

namespace AppBundle\Controller;

use AppBundle\AppBundle;
use AppBundle\Entity\Ads;
use AppBundle\Entity\Messages;
use AppBundle\Entity\Notifications;
use AppBundle\Entity\Product;
use AppBundle\Entity\Sells;
use AppBundle\Entity\User;
use AppBundle\Form\UserType;
use Doctrine\ORM\Query;
use Liip\ImagineBundle\Imagine\Cache\CacheManager;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\RepeatedType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TelType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use JMS\SecurityExtraBundle\Annotation\Secure;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;



class UserController extends Controller
{
    public function redirectToReferer(Request $request)
    {
        return $this->redirect(
            $request
                ->headers
                ->get('referer')
        );
    }

    /**
     * @Route("profilo/{query}", name="profilo")
     */
    public function profileIdAction($query)
    {
        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->findBy(array('name' => $query));

        $usr = $this->get('security.token_storage')->getToken()->getUser();


        $uid = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('e')
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);

        $categories = $this->getDoctrine()
            ->getRepository('AppBundle:Category')
            ->createQueryBuilder('e')
            ->select('e')
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);

        $sells = $this->getDoctrine()
            ->getRepository('AppBundle:Sells')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.fuid = :uname')
            ->setParameter('uname', $usr->getId())
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);

        $buys = $this->getDoctrine()
            ->getRepository('AppBundle:Buys')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.tuid = :uname')
            ->setParameter('uname', $usr)
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);

        $wish = $this->getDoctrine()
            ->getRepository('AppBundle:Wishlists')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.uid = :uid')
            ->setParameter('uid', $usr)
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);

        $uid = $this->convertUID($query);

        $messages = $this->getDoctrine()
            ->getRepository('AppBundle:Messages')
            ->findBy(array('toUID' => $uid), array('datetime' => "DESC"));

        $notReadMsg = $this->getDoctrine()->getRepository('AppBundle:Messages')->createQueryBuilder('u')
            ->select('count(u.id)')
            ->where('u.toUID = :toUID')
            ->andWhere('u.isRead = 0')
            ->setParameter('toUID', $uid)
            ->getQuery()
            ->getSingleScalarResult();

        $messagesR = $this->getDoctrine()
            ->getRepository('AppBundle:Messages')
            ->findBy(array('fromUID' => $uid), array('datetime' => "DESC"));

        $feedbacks = $this->getDoctrine()
            ->getRepository('AppBundle:Feedback')
            ->findBy(array('uid' => $uid));

        $ads = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('e')
            ->where("e.uname = :uid")
            ->setParameter('uid', $uid)
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);

        $adCount = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->where('e.uname = :uid')
            ->setParameter('uid', $uid)
            ->getQuery()
            ->getSingleScalarResult();

        if ($user == null) {
            return $this->redirectToRoute('error', array('error' => '03-001'));
            /*throw $this->createNotFoundException(
                'Utente '. $user . ' non trovato'
            );*/
        } else {

            $photo1 = '/home/ubuntu/workspace/web/uploads/photos/' . $uid . '-1.jpg';

            return $this->render('profile/profile.html.twig', [
                'user_info' => $user,
                'messages' => $messages,
                'messagesR' => $messagesR,
                'notReadMsg' => $notReadMsg,
                'feedback' => $feedbacks,
                'ads' => $ads,
                'photo_1' => $photo1,
                'user' => $this,
                'ad_count' => $adCount,
                'sells' => $sells,
                'wishes' => $wish,
                'buys' => $buys
            ]);
        }
    }

    /**
     * @Route("api/messages/{uid}", name="apiMessages")
     */
    public function apiMessagesUid($uid)
    {
        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->findBy(array('name' => $uid));

        $messages = $this->getDoctrine()
            ->getRepository('AppBundle:Messages')
            ->findBy(array('toUID' => $uid), array('datetime' => "DESC"));

        $notReadMsg = $this->getDoctrine()->getRepository('AppBundle:Messages')->createQueryBuilder('u')
            ->select('count(u.id)')
            ->where('u.toUID = :toUID')
            ->andWhere('u.isRead = 0')
            ->setParameter('toUID', $uid)
            ->getQuery()
            ->getSingleScalarResult();

        $messagesR = $this->getDoctrine()
            ->getRepository('AppBundle:Messages')
            ->findBy(array('fromUID' => $uid), array('datetime' => "DESC"));

        return $this->render('profile/pages/messages.html.twig', [
            'user_info' => $user,
            'messages' => $messages,
            'messagesR' => $messagesR,
            'notReadMsg' => $notReadMsg,
            'user' => $this,
        ]);
    }

    /**
     * @Route("api/dashboard/{uid}", name="apiDashboard")
     */
    public function apiDashboard($uid)
    {
        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->findBy(array('name' => $uid));
        $usr = $this->get('security.token_storage')->getToken()->getUser();

        $sells = $this->getDoctrine()
            ->getRepository('AppBundle:Sells')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.fuid = :uname')
            ->setParameter('uname', $usr->getId())
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);

        $buys = $this->getDoctrine()
            ->getRepository('AppBundle:Buys')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.tuid = :uname')
            ->setParameter('uname', $usr)
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);

        $wish = $this->getDoctrine()
            ->getRepository('AppBundle:Wishlists')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.uid = :uid')
            ->setParameter('uid', $usr)
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);

        return $this->render('profile/pages/dashboard.html.twig', [
            'user_info' => $user,
            'sells' => $sells,
            'wishes' => $wish,
            'buys' => $buys,
            'user' => $this,
        ]);
    }

    /**
     * @Route("/api/feedbacks/{uid}", name="apiFeedback")
     */
    public function apiFeedback($uid)
    {
        $feedbacks = $this->getDoctrine()
            ->getRepository('AppBundle:Feedback')
            ->findBy(array('uid' => $uid));

        return $this->render('profile/pages/feedbacks.html.twig', [
            'feedback' => $feedbacks,
        ]);
    }

    /**
     * @Route("/api/settings/{uid}", name="apiSettings")
     */
    public function apiSettings(Request $request,$uid)
    {
        $entity = $this->getDoctrine()->getRepository('AppBundle:User')->find($uid);

        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->findBy(array('id' => $uid));

        $settingsForm = $this->createFormBuilder($entity)
            ->add('email', TextType::class, [
                'label' => 'Indirizzo e-Mail',
                'attr' => [
                    'class' => 'list-group-item-action list-item-shadow'
                ],
                'help' => 'L\' indirizzo e-mail non verrà mostrato ad altri.'
            ])
            ->add('plain_password', RepeatedType::class, [
                'type' => PasswordType::class,
                'invalid_message' => 'Le due password devono essere uguali.',
                'options' => ['attr' => ['class' => 'list-group-item-action list-item-shadow']],
                'required' => false,
                'first_options'  => ['label' => 'Password'],
                'second_options' => ['label' => 'Ripeti Password'],
            ])
            ->add('realname', TextType::class, [
                'label' => 'Nome Completo',
                'attr' => [
                    'class' => 'list-group-item-action list-item-shadow'
                ]
            ])
            ->add('address', TextType::class, [
                'label' => 'Indirizzo',
                'attr' => [
                    'class' => 'list-group-item-action list-item-shadow'
                ]
            ])
            ->add('city', TextType::class, [
                'label' => 'Città',
                'attr' => [
                    'class' => 'list-group-item-action list-item-shadow'
                ]
            ])
            ->add('cap', TextType::class, [
                'label' => 'CAP',
                'attr' => [
                    'class' => 'list-group-item-action list-item-shadow'
                ]
            ])
            ->add('phone', TelType::class, [
                'label' => 'Telefono',
                'attr' => [
                    'class' => 'list-group-item-action list-item-shadow'
                ]
            ])
            ->add('submit', SubmitType::class,[
                'label' => 'Aggiorna',
                'attr' => [
                    'class' => 'btn btn-outline-primary'
                ]
            ])
            ->getForm();

        $settingsForm->handleRequest($request);

        if($settingsForm->isSubmitted() && $settingsForm->isValid()) {
            $em = $this->getDoctrine()->getManager();

            $em->flush();

            return $this->redirectToRoute('apiSettings' + '#settings');
        }

        return $this->render('profile/pages/settings.html.twig', [
            'user_info' => $user,
            'settingsForm' => $settingsForm->createView()
        ]);
    }

    /**
     * @Route("/api/annunci/{uid}", name="apiAds")
     */
    public function apiAds($uid)
    {

        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->findBy(array('id' => $uid));

        $ads = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('e')
            ->where("e.uname = :uid")
            ->setParameter('uid', $uid)
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);


        return $this->render('profile/pages/ads.html.twig', [
            'ads' => $ads,
            'user' => $this,
            'user_info' => $user
        ]);
    }

    /**
     * @Route("/upgrade", name="upgrade")
     */
    public function upgradeAction()
    {
        /** @var Product $bronze */
        $bronze = $this->getDoctrine()
            ->getRepository('AppBundle:Product')
            ->findOneBy(['name' => 'Bronzo']);
        /** @var Product $silver */
        $silver = $this->getDoctrine()
            ->getRepository('AppBundle:Product')
            ->findOneBy(['name' => 'Argento']);
        /** @var Product $gold */
        $gold = $this->getDoctrine()
            ->getRepository('AppBundle:Product')
            ->findOneBy(['name' => 'Oro']);

        /** @var User $user */
        $user = $this->get('security.token_storage')->getToken()->getUser();

        return $this->render('upgrade/upgrade.html.twig',
            [
                'user_id' => $user->getId(),
                'bronze' => $bronze,
                'silver' => $silver,
                'gold' => $gold
            ]
        );
    }

    /**
     * @Route("profilo/messaggi/{id}", name="message")
     */
    public function messageAction($id)
    {
        $em = $this->getDoctrine()->getManager();
        $messageRepo = $em->getRepository('AppBundle:Messages');
        $notificationRepo = $em->getRepository('AppBundle:Notifications');

        if ($message = $messageRepo->find($id)) {
            $usr = $this->get('security.token_storage')->getToken()->getUser();
            if ($message->getToUID() == $usr->getId() && $message->getIsRead() == 0) {
                $message->setIsRead(1);
                $em->persist($message);
                $em->flush();
            }
            if ($message->getToUID() == $usr->getId() && $notification = $notificationRepo->findOneBy(['object' => $message->getId()])) {
                if ($notification->getReaded() == false) {
                    $notification->setReaded(true);
                    $em->persist($notification);
                    $em->flush();
                }
            }
            if ($message->getToUID() == $usr->getId() || $message->getFromUID() == $usr->getId()) {
                return $this->render('profile/message.html.twig',
                    array('message' => $message,
                        'user' => $this));

            }
        }
    }

    /**
     * @Route("messagi/nuovo", name="nuovo_message")
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     */
    public function NuovoMessageAction(Request $request)
    {
        if (TRUE === $this->get('security.authorization_checker')->isGranted('ROLE_USER')) {
            $em = $this->getDoctrine()->getManager();
            $messageTime = new \DateTime();
            $message = new Messages();
            $message->setFromUID($this->getUser()->getID());
            $toUser = $em->getRepository('AppBundle:User')->findOneBy(['id' => $request->get('to')]);
            $message->setMessage($request->request->get('message'));
            $message->setToUID($toUser->getId());
            $message->setObject($request->request->get('object') ?? -1);
            $message->setDatetime($messageTime);
            $message->setIsRead(0);
            $em->persist($message);
            $em->flush();
            $notification = new Notifications();
            $notification->setReaded(false);
            $notification->setObject($message->getId());
            $notification->setType(6);
            $notification->setUid($toUser->getId());
            $notification->setDate($messageTime);
            $em->persist($notification);
            $em->flush();
            $message = \Swift_Message::newInstance()
                ->setSubject('Hai un nuovo messaggio!')
                ->setFrom('noreply@vedocompro.it')
                ->setFrom(array('noreply@vedocompro.it' => 'VedoCompro'))
                ->setTo($toUser->getEmail())
                ->setBody(
                    $this->renderView(
                        'Emails/message.notify.html.twig',
                        array(
                            'datetime' => $messageTime->format('d/m/Y H:i:s'),
                            'message' => $request->request->get('message'),
                            'userFrom' => $this->getUser()->getUsername(),
                            'userTo' => $toUser->getUsername()
                        )
                    ),
                    'text/html'
                );
            $this->get('mailer')->send($message);
            return $this->redirectToReferer($request);
        } else {
            return $this->redirectToRoute('login');
        }
    }

    /**
     * @Route("messagi/set_read", name="message_set_read")
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     */
    public function SetMessagesRead(Request $request)
    {
        if (TRUE === $this->get('security.authorization_checker')->isGranted('ROLE_USER')) {
            $this->setMessagesReadStatus($request->get('ids'), 1);
            return new Response("OK");
        } else {
            return $this->redirectToRoute('login');
        }
    }

    /**
     * @Route("messagi/set_non_read", name="message_set_non_read")
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     */
    public function SetMessagesUnRead(Request $request)
    {
        if (TRUE === $this->get('security.authorization_checker')->isGranted('ROLE_USER')) {
            $this->setMessagesReadStatus($request->get('ids'), 0);
            return new Response("OK");
        } else {
            return $this->redirectToRoute('login');
        }
    }

    private function setMessagesReadStatus($ids, $status)
    {
        $ids = explode(',', $ids);
        $em = $this->getDoctrine()->getManager();
        $messageRepo = $em->getRepository('AppBundle:Messages');
        $notificationRepo = $em->getRepository('AppBundle:Notifications');

        foreach ($ids as $id) {
            $message = $messageRepo->find($id);
            if ($message) {
                if ($notification = $notificationRepo->findOneBy(['object' => $message->getId()])) {
                    if ($notification->getReaded() == false) {
                        $notification->setReaded(true);
                        $em->persist($notification);
                    }
                }
                $message->setIsRead($status);
                $em->persist($message);
            }
        }
        $em->flush();
    }

    /**
     * @Route("profilo/{uid}/venduto/{aid}", name="sold_id")
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function soldAction($aid)
    {

        $entity = new Sells();

        $form = $this->createFormBuilder($entity)
            ->setMethod('GET')
            ->setAction($this->generateUrl('processSell'))
            ->add('tuid', TextType::class, array('label' => 'Utente', 'attr' => array('class' => 'form-control')))
            ->add('fuid', HiddenType::class, array('data' => $this->getUser()->getUsername()))
            ->add('aid', HiddenType::class, array('data' => $aid))
            ->add('submit', SubmitType::class, array('label' => 'Salva', 'attr' => array('class' => 'btn-outline-success')))
            ->getForm()
            ->createView();

        return $this->render(':profile:sold.html.twig', array('form' => $form));
    }

    /**
     * @return \Symfony\Component\HttpFoundation\Response
     * @Route("profilo/venduto/process",name="processSell")
     */
    public function soldForm()
    {
        return null;
    }

    /**
     * @Route("profilo/{uid}/tracking/{aid}", name="tracking")
     */
    public function trackingAction($aid)
    {
        $trackingCode = $this->getDoctrine()
            ->getRepository("AppBundle:Ads")
            ->createQueryBuilder("t")
            ->select('t.trackingCode')
            ->where('t.id = :id')
            ->setParameter('id', $aid)
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);

        return $this->render(':profile:tracking.html.twig', [
            'code' => $trackingCode[0]['trackingCode']
        ]);
    }

    /**
     * @Route("profilo/{uid}/{aid}/srp/", name="setReceivedPayment")
     */
    public function setReceivedPayment($uid, $aid)
    {
        $em = $this->getDoctrine()->getEntityManager();
        $conn = $em->getConnection();
        $query = ("UPDATE `sells` SET `paid` = '1' WHERE `sells`.`id` = $aid;");
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $uid = $this->convertUser($uid);
        return $this->redirectToRoute("profilo", ['query' => $uid]);
    }

    /**
     * @Route("profilo/{uid}/{aid}/usrp/", name="unsetReceivedPayment")
     */
    public function unsetReceivedPayment($uid, $aid)
    {
        $em = $this->getDoctrine()->getEntityManager();
        $conn = $em->getConnection();
        $query = ("UPDATE `sells` SET `paid` = '0' WHERE `sells`.`id` = $aid;");
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $uid = $this->convertUser($uid);
        return $this->redirectToRoute("profilo", ['query' => $uid]);
    }

    /**
     * @Route("profilo/{uid}/{aid}/sas/", name="setAsShipped")
     */
    public function setAsShipped($uid, $aid)
    {
        $em = $this->getDoctrine()->getManager();
        $conn = $em->getConnection();
        $query = ("UPDATE `sells` SET `shipped` = '1' WHERE `sells`.`id` = $aid;");
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $uid = $this->convertUser($uid);
        return $this->redirectToRoute("profilo", ['query' => $uid]);
    }

    /**
     * @Route("profilo/{uid}/{aid}/usas/", name="unsetAsShipped")
     */
    public function unsetAsShipped($uid, $aid)
    {
        $em = $this->getDoctrine()->getManager();
        $conn = $em->getConnection();
        $query = ("UPDATE `sells` SET `shipped` = '0' WHERE `sells`.`id` = $aid;");
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $uid = $this->convertUser($uid);
        return $this->redirectToRoute("profilo", ['query' => $uid]);
    }

    /**
     * @Route("profilo/messaggi/processSendMessage/{mid}", name="sendmessage")
     */

    public function processSendMessage($mid)
    {
        $em = $this->getDoctrine()->getRepository('AppBundle:Messages')->createQueryBuilder('m')
            ->select('m')->where('m.id = :mid')->setParameter('mid', $mid)
            ->getQuery()->getResult(Query::HYDRATE_ARRAY);

        if ($this->getLoggedUser() == $em[0]['toUID']) {
            if ($_GET['fromUID'] && $_GET['toUID'] && $_GET['datetime'] && $_GET['message'] && $_GET['objectID']) {
                $fromUID = $this->get('security.token_storage')->getToken()->getUser();

                $em = $this->getDoctrine()->getManager();
                $conn = $em->getConnection();
                $query = ("INSERT INTO `messages` (`id`, `from_uid`, `to_uid`, `datetime`, `message`, `is_read`, `object`) VALUES (NULL, :fromUID, :toUID, :mdatetime, :message, '0', :objectID)");
                $stmt = $conn->prepare($query);
                $stmt->bindValue("fromUID", $_GET['fromUID']);
                $stmt->bindValue("toUID", $_GET['toUID']);
                $stmt->bindValue("mdatetime", $_GET['datetime']);
                $stmt->bindValue("message", $_GET['message']);
                $stmt->bindValue("objectID", $_GET['objectID']);
                $stmt->execute();

                $usr = $this->get('security.token_storage')->getToken()->getUser();
                $uname = $usr->getUsername();
                $mail = $usr->getEmail();

                $uid = $this->getLoggedUser();

                $user = $this->getDoctrine()
                    ->getRepository('AppBundle:User')
                    ->find($_GET['toUID']);

                $message = \Swift_Message::newInstance()
                    ->setSubject('Hai un nuovo messaggio!')
                    ->setFrom('noreply@vedocompro.it')
                    ->setFrom(array('noreply@vedocompro.it' => 'VedoCompro'))
                    ->setTo($user->getEmail())
                    ->setBody(
                        $this->renderView(
                            'Emails/message.notify.html.twig',
                            array(
                                'datetime' => $_GET['datetime'],
                                'message' => $_GET['message'],
                                'userFrom' => $uname,
                                'userTo' => $user->getUsername()
                            )
                        ),
                        'text/html'
                    );
                $this->get('mailer')->send($message);

                return $this->redirectToRoute("profilo", ['query' => $uname]);
            }

        }
    }

    /**
     * @Route("messaggi/processSendMessageAds", name="sendmessageAds")
     */

    public function processSendMessageAds()
    {
        if ($_GET['fromUID'] && $_GET['toUID'] && $_GET['datetime'] && $_GET['message'] && $_GET['objectID']) {
            $em = $this->getDoctrine()->getManager();
            $conn = $em->getConnection();
            $query = ("INSERT INTO `messages` (`id`, `from_uid`, `to_uid`, `datetime`, `message`, `is_read`, `object`) VALUES (NULL, :fromUID, :toUID, :mdatetime, :message, '0', :objectID)");
            $stmt = $conn->prepare($query);
            $stmt->bindValue("fromUID", $_GET['fromUID']);
            $stmt->bindValue("toUID", $_GET['toUID']);
            $stmt->bindValue("mdatetime", $_GET['datetime']);
            $stmt->bindValue("message", $_GET['message']);
            $stmt->bindValue("objectID", $_GET['objectID']);
            $stmt->execute();
            $uid = $this->convertUser($this->getLoggedUser());

            $user = $this->getDoctrine()->getRepository('AppBundle:User')
                ->find($uid);

            $userName = $this->get('security.token_storage')->getToken()->getUsername();

            $message = \Swift_Message::newInstance()
                ->setSubject('Hai un nuovo messaggio da' . $userName . '!')
                ->setFrom('noreply@vedocompro.it')
                ->setTo($user->getEmail())
                ->setBody(
                    $this->renderView(
                        'Emails/message.notify.html.twig',
                        array(
                            'datetime' => $_GET['datetime'],
                            'message' => $_GET['message'],
                            'userFrom' => $userName,
                            'userTo' => $user->getUsername()
                        )
                    ),
                    'text/html'
                );
            $this->get('mailer')->send($message);

            return $this->redirectToRoute("profilo", ['query' => $uid]);
        }
    }

    /**
     * @Route("ads/deleteads/{id}", name="deletead")
     */
    public function deleteAds($id)
    {
        $em = $this->getDoctrine()->getManager();
        $ad = $em->getReference('AppBundle:Ads', $id);
        $em->remove($ad);
        $em->flush();

    }

    /**
     * @Route("api/deletemessage/{id}", name="deletemessage")
     * @Method({"POST"})
     */
    public function deleteMessage(Request $request, $id)
    {
        /** @var \Symfony\Component\Security\Core\User\User $user */
        $user = $this->get('security.token_storage')->getToken()->getUser();
        $em = $this->get('doctrine.orm.entity_manager');
        $messagesRepo = $em->getRepository('AppBundle:Messages');
        if ($message = $messagesRepo->findOneBy(['toUID' => $user->getId(), 'id' => $id])) {
            $notificationRepo = $em->getRepository('AppBundle:Notifications');
            if ($message->getToUID() == $user->getId() && $notification = $notificationRepo->findOneBy(['object' => $message->getId()])) {
                if ($notification->getReaded() == false) {
                    $notification->setReaded(true);
                    $em->remove($notification);
                }
            }
            $em->remove($message);
            $em->flush();
        }
        return $this->redirectToRoute("profilo", ["query" => $user->getUsername(), "_fragment" => "messaggi"]);
    }

    /**
     * @Route("ads/leavefeed/{uid}/{aid}", name="feedback_leave")
     */
    public function leaveFeedbackPage($uid, $aid)
    {
        return $this->render('profile/feedback.leave.html.twig', [
            'uid' => $uid,
            'aid' => $aid
        ]);
    }

    /**
     * @Route("ads/leavefeed/process/{uid}/{aid}", name="leave_feed_process")
     */
    public function leave_feed_process($uid, $aid)
    {
        return dump($_GET);
    }

    /**
     * @Route("profilo/{uid}/uploadPic", name="uploadUpic")
     * @param $uid
     * @return Response
     */
    public function upload_user_pic($uid)
    {

        $entity = new User();

        $form = $this->createFormBuilder($entity)
            ->add('file', FileType::class, array('label' => 'Immagine Profilo', 'attr' => array('class' => 'form-control')))
            ->add('submit', SubmitType::class, array('label' => 'Search', 'attr' => array('class' => 'btn-success')))
            ->getForm();

        if ($form->isSubmitted && $form->isValid) {
            return null;
        }

        return $this->render('modals/profile.changepic.html.twig');
    }

    /**
     * @Route("porta-un-amico", name="bring-a-friend")
     */

    public function referAction()
    {
        return $this->render('bring-a-friend/bring-a-friend.html.twig');
    }

    public function convertUser($userID)
    {
        /** @var User $uname */
        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->find($userID);
        return $user ? $user->getName() : null;
    }

    public function getMessageFromUser($userID)
    {
        /** @var User $uname */
        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->find($userID);
        if ($user === null) {
            return null;
        } elseif ($user->hasRole('ROLE_SUPER_ADMIN') == true || $user->hasRole('ROLE_ADMIN')) {
            return 'Vedocompro.it';
        } else {
            return $user->getName();
        }
    }

    public function convertUID($userID)
    {
        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->findOneBy(['name' => $userID]);
        return $user ? $user->getId() : null;
    }

    public function convertAds($adID)
    {
        /** @var Ads $ad */
        $ad = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->find($adID);

        return $ad ? $ad->getName() : null;
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
            ->getResult(Query::HYDRATE_ARRAY);
        return $catname[0]["name"];
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

    public function getSell($id, $option)
    {
        switch ($option) {
            case 'isSellOrBuy':
                $get = $this->getDoctrine()
                    ->getRepository('AppBundle:Sells')
                    ->createQueryBuilder('e')
                    ->select('e.type')
                    ->where('e.id = :aid')
                    ->setParameter('aid', $id)
                    ->getQuery()
                    ->getResult(Query::HYDRATE_ARRAY);
                return $get[0]['type'];
                break;
            case 'isVerified':
                $get = $this->getDoctrine()
                    ->getRepository('AppBundle:Sells')
                    ->createQueryBuilder('e')
                    ->select('e.verified')
                    ->where('e.id = :aid')
                    ->setParameter('aid', $id)
                    ->getQuery()
                    ->getResult(Query::HYDRATE_ARRAY);
                return $get[0]['verified'];
                break;
            case 'status':
                $get = $this->getDoctrine()
                    ->getRepository('AppBundle:Sells')
                    ->createQueryBuilder('e')
                    ->select('e.status')
                    ->where('e.id = :aid')
                    ->setParameter('aid', $id)
                    ->getQuery()
                    ->getResult(Query::HYDRATE_ARRAY);
                return $get[0]['status'];
                break;
            case 'isPaid':
                $get = $this->getDoctrine()
                    ->getRepository('AppBundle:Sells')
                    ->createQueryBuilder('e')
                    ->select('e.paid')
                    ->where('e.id = :aid')
                    ->setParameter('aid', $id)
                    ->getQuery()
                    ->getResult(Query::HYDRATE_ARRAY);
                return $get[0]['paid'];
                break;
            case 'isShipped':
                $get = $this->getDoctrine()
                    ->getRepository('AppBundle:Sells')
                    ->createQueryBuilder('e')
                    ->select('e.shipped')
                    ->where('e.id = :aid')
                    ->setParameter('aid', $id)
                    ->getQuery()
                    ->getResult(Query::HYDRATE_ARRAY);
                return $get[0]['shipped'];
                break;
            case 'isFeedIn':
                $get = $this->getDoctrine()
                    ->getRepository('AppBundle:Sells')
                    ->createQueryBuilder('e')
                    ->select('e.feedin')
                    ->where('e.id = :aid')
                    ->setParameter('aid', $id)
                    ->getQuery()
                    ->getResult(Query::HYDRATE_ARRAY);
                return $get[0]['feedin'];
                break;
            case 'isFeedOut':
                $get = $this->getDoctrine()
                    ->getRepository('AppBundle:Sells')
                    ->createQueryBuilder('e')
                    ->select('e.feedout')
                    ->where('e.id = :aid')
                    ->setParameter('aid', $id)
                    ->getQuery()
                    ->getResult(Query::HYDRATE_ARRAY);
                return $get[0]['feedout'];
                break;
        }
    }

    function getLoggedUser()
    {
        $usr = $this->get('security.token_storage')->getToken()->getUser();
        return $usr->getId();
    }
    /**
     * @Route("profile/uploadpic/{uid}", name="uploadpic")
     */
    public function uploadPicAction(Request $request, $uid)
    {
        $fileSystem = new Filesystem();

        $manager = $this->getDoctrine()->getManager();
        $user = $manager->getRepository(User::class)->find($uid);

        $output = array('uploaded' => false);
        // get the file from the request object
        $file = $request->files->get('file');
        // generate a new filename (safer, better approach)
        // To use original filename, $fileName = $this->file->getClientOriginalName();
        //$fileName = $uid. '.jpg';
        $fileName = md5(uniqid()).'.'.$file->guessExtension();

        $currentPic = $user->getPic();
        $fileSystem->remove($this->get('kernel')->getRootDir() . '/../web/uploads/profile/'. $currentPic);
        $fileSystem->remove($this->get('kernel')->getRootDir() . '/../media/cache/profile_img_filter/uploads/profile/'. $currentPic);

        $user->setPic($fileName);
        $manager->flush($user);

        // set your uploads directory
        $uploadDir = $this->get('kernel')->getRootDir() . '/../web/uploads/profile/';
        if (!file_exists($uploadDir) && !is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }
        if ($file->move($uploadDir, $fileName)) {
            $output['uploaded'] = true;
            $output['fileName'] = $fileName;
        }
        //$cacheManager->remove($fileName);

        return new JsonResponse($output);
    }

    /**
     * @Route("profile/deletepic/{uid}", name="deletepic")
     */
    public function deletePicAction($uid) {
        $fileSystem = new Filesystem();

        $manager = $this->getDoctrine()->getManager();
        $user = $manager->getRepository(User::class)->find($uid);

        $currentPic = $user->getPic();
        $fileSystem->remove($this->get('kernel')->getRootDir() . '/../web/uploads/profile/'. $currentPic);
        $fileSystem->remove($this->get('kernel')->getRootDir() . '/../media/cache/profile_img_filter/uploads/profile/'. $currentPic);

        //TODO: Non generare una nuova immagine, ma usa quella di default
        $newPic = md5(uniqid()).'.jpg';
        copy($_SERVER['DOCUMENT_ROOT'] . "/uploads/default_upic.jpg", $_SERVER['DOCUMENT_ROOT'] . "/uploads/profile/" . $newPic);
        $user->setPic($newPic);
        $manager->flush($user);

        return $this->redirectToRoute('profilo', [
            'query' => $this->getUser()->getUsername()
            ]);
    }

    /**
     * @Route("media/cache/profile_img_filter/uploads/profile/{picid}", name="denyPic")
     */
    public function denyPicAction() {
        return new Response('Sorry, You can\'t directly request this pic.');
    }
}
