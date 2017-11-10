<?php

namespace AppBundle\Controller;

use AppBundle\AppBundle;
use AppBundle\Entity\Messages;
use AppBundle\Entity\Sells;
use AppBundle\Entity\User;
use Doctrine\ORM\Query;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\HttpFoundation\Request;

class UserController extends Controller
{
    /**
     * @Route("profilo/{query}", name="profilo")
     */
    public function profileIdAction($query)
    {
        $user = $this->getDoctrine()
        ->getRepository('AppBundle:User')
        ->findBy(array('name' => $query));

        $usr= $this->get('security.token_storage')->getToken()->getUser();

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
                ->setParameter('uname',$usr)
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
               
        $uid = $this->convertUID($query);
        
        $messages = $this->getDoctrine()
                ->getRepository('AppBundle:Messages')
                ->findBy(array('toUID' =>$uid),array('datetime'=>"DESC"));

        $notReadMsg = $this->getDoctrine()->getRepository('AppBundle:Messages')->createQueryBuilder('u')
            ->select('count(u.id)')
            ->where('u.toUID = :toUID')
            ->andWhere('u.isRead = 0')
            ->setParameter('toUID', $uid)
            ->getQuery()
            ->getSingleScalarResult();

        $messagesR = $this->getDoctrine()
            ->getRepository('AppBundle:Messages')
            ->findBy(array('fromUID' =>$uid),array('datetime'=>"DESC"));

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

        
        if (!$user) {
            throw $this->createNotFoundException(
                'Utente '. $user . ' non trovato'
            );
        }
        
        $photo1 = '/home/ubuntu/workspace/web/uploads/photos/' . $uid . '-1.jpg';
        
        return $this->render('profile/profile.html.twig', [
            'user_info'=>$user,
            'messages'=>$messages,
            'messagesR' => $messagesR,
            'notReadMsg' => $notReadMsg,
            'feedback'=>$feedbacks,
            'ads' => $ads,
            'photo_1' => $photo1,
            'user' => $this,
            'ad_count' => $adCount,
            'sells' => $sells,
            'buys' => $buys
        ]);
    }

    /**
     * @Route("/upgrade", name="upgrade")
     */
    public function upgradeAction()
    {
        return $this->render('upgrade/upgrade.html.twig');
    }

    /**
     * @Route("profilo/messaggi/{id}", name="message")
     */
    public function messageAction($id)
    {
        $message = $this->getDoctrine()
                        ->getRepository('AppBundle:Messages')
                        ->createQueryBuilder('m')
                        ->select('m')
                        ->where("m.id = :mid")
                        ->setParameter('mid', $id)
                        ->getQuery()
                        ->getResult(Query::HYDRATE_ARRAY);

        $usr= $this->get('security.token_storage')->getToken()->getUser();
        $usr->getId();

        $messages = new Messages();

        if ($message[0]['toUID'] == $usr->getId()) {
            if ($message[0]['isRead'] == '0') {
                $em = $this->getDoctrine()->getEntityManager();
                $conn = $em->getConnection();
                $query=("UPDATE `messages` SET `is_read` = '1' WHERE `messages`.`id` = :mid;");
                $stmt = $conn->prepare($query);
                $stmt->bindParam("mid", $message[0]['id']);
                $stmt->execute();
            }
            return $this->render('profile/message.html.twig',
                array('message' => $message,
                      'user' => $this));
        } elseif ($message[0]['fromUID'] == $usr->getId()) {
            return $this->render('profile/message.html.twig',
                array('message' => $message,
                    'user' => $this));
        }
    }

    /**
     */
    public function sendMessageForm(Request $request)
    {
        $entity = new Messages();

        $form = $this->createFormBuilder($entity)
            ->add('message', TextareaType::class, array('label'=> 'Messaggio', 'attr' => array('class' => 'form-control','width' => '100%', 'rows' => '15')))
            ->add('fromUID', HiddenType::class, '')
            ->add('toUID', HiddenType::class,'')
            ->add('object', HiddenType::class, '')
            ->add('submit',SubmitType::class, array('label' => 'Search','attr' => array('class' => 'btn-success')))
            ->getForm();

        if($form->isSubmitted && $form->isValid)
        {
            $now = date("d-m-Y h:m:s");
            $usr= $this->get('security.token_storage')->getToken()->getUser();

            $entity->setDatetime($now);
            $entity->setFromUID($usr);
            $entity->setIsRead('0');
            $entity->setObject('');
            $entity->setToUID('');
            $entity->setMessage($request['message']);
        }

        return $this->render(
            ':profile:form.message.html.twig',
            array(
                'form' => $form->createView()
            ));
    }

    /**
     * @Route("profilo/{uid}/venduto/{aid}", name="sold_id")
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function soldAction($aid) {

        $entity = new Sells();

        $form = $this->createFormBuilder($entity)
            ->setMethod('GET')
            ->setAction($this->generateUrl('processSell'))
            ->add('tuid', TextType::class, array('label'=> 'Utente','attr' =>array('class' => 'form-control')))
            ->add('fuid', HiddenType::class, array('data' => $this->getUser()->getUsername()))
            ->add('aid', HiddenType::class, array('data' => $aid))
            ->add('submit',SubmitType::class, array('label' => 'Salva','attr' => array('class' => 'btn-outline-success')))
            ->getForm()
            ->createView();

        return $this->render(':profile:sold.html.twig', array('form' => $form));
    }

    /**
     * @return \Symfony\Component\HttpFoundation\Response
     * @Route("profilo/venduto/process",name="processSell")
     */
    public function soldForm() {
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
                            ->setParameter('id',$aid)
                            ->getQuery()
                            ->getResult(Query::HYDRATE_ARRAY);




        return $this->render(':profile:tracking.html.twig',[
            'code' => $trackingCode[0]['trackingCode']
        ]);
    }

    /**
     * @Route("profilo/{uid}/{aid}/srp/", name="setReceivedPayment")
     */
    public function setReceivedPayment($uid,$aid)
    {
        $em = $this->getDoctrine()->getEntityManager();
        $conn = $em->getConnection();
        $query=("UPDATE `sells` SET `paid` = '1' WHERE `sells`.`id` = $aid;");
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $uid = $this->convertUser($uid);
        return $this->redirectToRoute("profilo",['query'=>$uid]);
    }

    /**
     * @Route("profilo/{uid}/{aid}/usrp/", name="unsetReceivedPayment")
     */
    public function unsetReceivedPayment($uid,$aid)
    {
        $em = $this->getDoctrine()->getEntityManager();
        $conn = $em->getConnection();
        $query=("UPDATE `sells` SET `paid` = '0' WHERE `sells`.`id` = $aid;");
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $uid = $this->convertUser($uid);
        return $this->redirectToRoute("profilo",['query'=>$uid]);
    }

    /**
     * @Route("profilo/{uid}/{aid}/sas/", name="setAsShipped")
     */
    public function setAsShipped($uid,$aid)
    {
        $em = $this->getDoctrine()->getEntityManager();
        $conn = $em->getConnection();
        $query=("UPDATE `sells` SET `shipped` = '1' WHERE `sells`.`id` = $aid;");
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $uid = $this->convertUser($uid);
        return $this->redirectToRoute("profilo",['query'=>$uid]);
    }

    /**
     * @Route("profilo/{uid}/{aid}/usas/", name="unsetAsShipped")
     */
    public function unsetAsShipped($uid,$aid)
    {
        $em = $this->getDoctrine()->getEntityManager();
        $conn = $em->getConnection();
        $query=("UPDATE `sells` SET `shipped` = '0' WHERE `sells`.`id` = $aid;");
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $uid = $this->convertUser($uid);
        return $this->redirectToRoute("profilo",['query'=>$uid]);
    }

    /**
     * @Route("profilo/messaggi/processSendMessage/{mid}", name="sendmessage")
     */

    public function processSendMessage($mid) {
        $em = $this->getDoctrine()->getRepository('AppBundle:Messages')->createQueryBuilder('m')
                   ->select('m')->where('m.id = :mid')->setParameter('mid', $mid)
                   ->getQuery()->getResult(Query::HYDRATE_ARRAY);

        if($this->getLoggedUser() == $em[0]['toUID']) {
            if($_GET['fromUID'] && $_GET['toUID'] && $_GET['datetime'] && $_GET['message'] && $_GET['objectID']) {
                $em = $this->getDoctrine()->getEntityManager();
                $conn = $em->getConnection();
                $query=("INSERT INTO `messages` (`id`, `from_uid`, `to_uid`, `datetime`, `message`, `is_read`, `object`) VALUES (NULL, :fromUID, :toUID, :mdatetime, :message, '0', :objectID)");
                $stmt = $conn->prepare($query);
                $stmt->bindValue("fromUID", $_GET['fromUID']);
                $stmt->bindValue("toUID", $_GET['toUID']);
                $stmt->bindValue("mdatetime", $_GET['datetime']);
                $stmt->bindValue("message", $_GET['message']);
                $stmt->bindValue("objectID", $_GET['objectID']);
                $stmt->execute();
                $uid = $this->convertUser($this->getLoggedUser());
                return $this->redirectToRoute("profilo",['query'=>$uid]);
            }

        }
    }

    /**
     * @Route("messaggi/processSendMessageAds", name="sendmessageAds")
     */

    public function processSendMessageAds() {
        if($_GET['fromUID'] && $_GET['toUID'] && $_GET['datetime'] && $_GET['message'] && $_GET['objectID']) {
            $em = $this->getDoctrine()->getEntityManager();
            $conn = $em->getConnection();
            $query=("INSERT INTO `messages` (`id`, `from_uid`, `to_uid`, `datetime`, `message`, `is_read`, `object`) VALUES (NULL, :fromUID, :toUID, :mdatetime, :message, '0', :objectID)");
            $stmt = $conn->prepare($query);
            $stmt->bindValue("fromUID", $_GET['fromUID']);
            $stmt->bindValue("toUID", $_GET['toUID']);
            $stmt->bindValue("mdatetime", $_GET['datetime']);
            $stmt->bindValue("message", $_GET['message']);
            $stmt->bindValue("objectID", $_GET['objectID']);
            $stmt->execute();
            $uid = $this->convertUser($this->getLoggedUser());
            return $this->redirectToRoute("profilo",['query'=>$uid]);
        }
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
               ->getResult(Query::HYDRATE_ARRAY);
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
            ->getResult(Query::HYDRATE_ARRAY);
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
               ->getResult(Query::HYDRATE_ARRAY);
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

    public function getSell($id,$option)
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

    function getLoggedUser() {
        $usr= $this->get('security.token_storage')->getToken()->getUser();
        return $usr->getId();
    }
}