<?php

namespace AppBundle\Controller;

use AppBundle\Entity\BusinessStats;
use AppBundle\Entity\Category;
use AppBundle\Entity\Reviews;
use AppBundle\Entity\User;
use AppBundle\Entity\Videos;
use AppBundle\Form\AdsUserType;
use Doctrine\ORM\EntityRepository;
use Doctrine\ORM\Query;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Swift_Message;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\MoneyType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use JMS\SecurityExtraBundle\Annotation\Secure;
use AppBundle\Entity\Ads;
use Symfony\Component\Finder\Finder;
use Symfony\Component\HttpFoundation\Response;

//TODO: Sistemare immagine di default

class AdsController extends Controller
{
    /**
     * @Route("annuncio/{category}/{item}/{title}", name="vedi_oggetto")
     * @param $category
     * @param $item
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function showAction($category, $item, Request $request)
    {

        $ad = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->findBy(array('id' => $item));

        $video = $this->getDoctrine()
            ->getRepository('AppBundle:Videos')
            ->findOneBy(array('aid' => $item));

        $id = $item;

        if ($ad != null) {

            $categoryID = $this->getDoctrine()->getRepository('AppBundle:Ads')
                ->createQueryBuilder('e')->select('e.category')->where('e.id = :item')->setParameter('item', $item)
                ->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

            $result = $this->getDoctrine()
                ->getRepository('AppBundle:Ads')
                ->createQueryBuilder('e')
                ->select('e')
                ->where('e.id = :item')
                ->setParameter('item', $item)
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

            if ($result) {
                $sellerID = $result[0]['uname'];
            } else {
                $sellerID = null;
            }

            $seller = $this->getDoctrine()
                ->getRepository('AppBundle:User')
                ->createQueryBuilder('e')
                ->select('e')
                ->where('e.id = :uname')
                ->setParameter('uname', $sellerID)
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

            $isWhish = $this->getDoctrine()
                ->getRepository('AppBundle:Wishlists')
                ->createQueryBuilder('e')
                ->select('e')
                ->where('e.uid = :uname')
                ->andWhere('e.aid = :aid')
                ->setParameter('uname', $this->get('security.token_storage')->getToken()->getUser())
                ->setParameter('aid', $item)
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

            $feedbacksPos = $this->getDoctrine()
                ->getRepository('AppBundle:Feedback')
                ->createQueryBuilder('e')
                ->select('e')
                ->where('e.uid = :uname')
                ->andWhere('e.positive = 1')
                ->setParameter('uname', $sellerID)
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

            $feedbacksNeg = $this->getDoctrine()
                ->getRepository('AppBundle:Feedback')
                ->createQueryBuilder('e')
                ->select('e')
                ->where('e.uid = :uname')
                ->andWhere('e.positive = 0')
                ->setParameter('uname', $sellerID)
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

            $nCount = 0;
            $pCount = 0;
            if ($feedbacksPos != null) {
                $pCount = count($feedbacksPos);
            } else {
                $pCount == 0;
            }
            if ($feedbacksNeg != null) {
                $nCount = count($feedbacksNeg);
            } else {
                $nCount == 0;
            }

            if ($feedbacksPos != null OR $feedbacksNeg != null) {
                if (($pCount + $nCount) == 0) {
                    $feedPercent = 0;
                } else {
                    $feedPercent = round($pCount / ($pCount + $nCount) * 100, '2');
                }
            }


            $current = $this->getDoctrine()
                ->getRepository('AppBundle:Ads')
                ->createQueryBuilder('e')
                ->select('e.views')
                ->where('e.id = :id')
                ->setParameter('id', $id)
                ->getQuery()
                ->getSingleScalarResult();

            $adID = $item;

            if ( $this->getParameter('kernel.environment') == "prod" ) {
                $viewsVal = $current + 1;
            } else {
                $viewsVal = $current;
            }

            $em = $this->getDoctrine()->getManager();
            $conn = $em->getConnection();
            $query = ("UPDATE `ads` SET `views` = :newViews WHERE `ads`.`id` = :adID;");
            $stmt = $conn->prepare($query);
            $stmt->bindParam('newViews', $viewsVal);
            $stmt->bindParam('adID', $adID);
            $stmt->execute();

            $em = $this->getDoctrine()->getManager();
            $em->flush();

            $similar = $this->getDoctrine()
                ->getRepository('AppBundle:Ads')
                ->createQueryBuilder('e')
                ->select('e')
                ->where('e.category = :category')
                ->andWhere('e.id != :item')
                ->setParameter('category', $categoryID[0]['category'])
                ->setParameter('item', $item)
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

            $thisAd = $this->getDoctrine()
                ->getRepository('AppBundle:Ads')
                ->find($item);
            $adsUsr = $this->getDoctrine()->getRepository(User::class)->find($thisAd->getUname())->getIsCompany();

            if ($adsUsr == 1) {
                $stat = new BusinessStats();

                $stat->setDatetime(new \DateTime());
                $stat->setAdid($thisAd->getId());
                $stat->setUid($thisAd->getUname());
                $stat->setType(1);

                $em = $this->getDoctrine()->getManager();

                $em->persist($stat);
                $em->flush();
            }

            $thisAd = $this->getDoctrine()->getRepository(Ads::class)->find($item);

            if ($thisAd->getHasReviews() == 1) {
                $reviews = $this->getDoctrine()->getRepository(Reviews::class)->findBy(['aid' => $thisAd->getId(), 'isPublished' => true]);
            } else {
                $reviews = [];
            }

            $reviewsForm = $this->createFormBuilder(new Reviews)
                ->add('comment', TextAreaType::class, [
                    'label' => 'Commento',
                    'attr' => [
                        'cols' => 5
                    ],
                    'label_attr' => [
                        'class' => 'mt-2'
                    ]
                ])
                ->add('submit', SubmitType::class, [
                    'attr' => [
                        'class' => 'btn btn-primary mt-3 hidden',
                        'name' => 'formReview[submit]',
                        'id' => 'form_review_submit'
                    ],
                    'label' => 'Recensisci'
                ])
                ->getForm();

            $reviewsForm->handleRequest($request);

            if($reviewsForm->isSubmitted() && $reviewsForm->isValid() && $request->request->has('appbundle_reviews')) {
                $em = $this->getDoctrine()->getManager();

                $review = new Reviews;

                $review->setUid($this->getUser()->getId());
                $review->setAid($item);
                $review->setDatetime(new \DateTime());
                $review->setIsPublished(0);

                $em->persist($review);
                $em->flush();

            }

            return $this->render('ads/view.html.twig', [
                'ad_info' => $ad,
                'video' => $video,
                'ad_category' => $category,
                'user_info' => $seller,
                'feed_percent' => $feedPercent ?? 0,
                'is_wish' => $isWhish,
                'similar' => $similar,
                'reviews' => $reviews,
                'reviewsForm' => $reviewsForm->createView(),
                'ads' => $this
            ]);
        } else {
            return $this->redirectToRoute('error', array('error' => '02-001'));
        }
    }

    /**
     * @Route("/nuovo/", name="nuovo")
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     */
    public function addAction(Request $request)
    {
        if (TRUE === $this->get('security.authorization_checker')->isGranted('ROLE_USER')) {

            set_time_limit(0);

            $usr = $this->get('security.token_storage')->getToken()->getUser()->getID();
            $usrName = $this->getUser()->getUsername();

            $newAd = new Ads();
            $newAd->setUname($usr);
            $newAd->setCreationtime(new \DateTime());
            $newAd->setUpdatetime(new \DateTime());
            $newAd->setViews(0);
            $newAd->setPublished(0);
            $newAd->setOption1('');
            $newAd->setOption2('');
            $newAd->setOption3('');
            $newAd->setOption4('');
            $newAd->setOption5('');
            $newAd->setFields([]);
            $newAd->setVals([]);

            $newAd->setShowcase(0);
            $newAd->setSold(0);
            $newAd->setTrackingCode('');
            $newAd->setObjLevel(0);

            $form = $this->createFormBuilder($newAd)
                //*->add('video', FileType::class, array('attr' => array('class' => 'dropzone')))**/
                ->add('name', TextType::class, array('label' => 'Nome', 'attr' => array('class' => 'required')))
                ->add('description', TextareaType::class, array('attr' => array('rows' => '5'), 'label' => 'Descrizione'))
                ->add('category', EntityType::class, array(
                    'class' => 'AppBundle:Category',
                    'placeholder' => 'Scegli Categoria',
                    'empty_data' => null,
                    'required' => true,
                    'label' => 'Categoria',
                    'group_by' => 'parentName',
                    'query_builder' => function (EntityRepository $repo) {
                        $qb = $repo->createQueryBuilder('l');
                        $qb->andWhere('l.parent IS NOT NULL');
                        return $qb;
                    }))
                ->add('price', IntegerType::class, array('label' => 'Prezzo'))
                ->add('objCondition', ChoiceType::class, array(
                    'label' => 'Condizione',
                    'placeholder' => 'Seleziona Condizione',
                    'required' => true,
                    'choices' => array(
                        'Nuovo' => 'Nuovo',
                        'Usato' => 'Usato',
                        'Ricondizionato' => 'Ricondizionato',
                        'Non Funzionante' => 'Non Funzionante'
                    )
                ))
                ->add('location', TextType::class)

                /*EntityType::class, array(
                    'label' => 'Dove si trova',
                    'placeholder' => 'Seleziona Comune',
                    'required' => true,
                    'empty_data' => null,
                    'class' => 'AppBundle\Entity\comuni',
                    'choice_label' => 'nome',
                    'choice_value' => 'nome',
                    'query_builder' => function (EntityRepository $repo) {
                        $qb = $repo->createQueryBuilder('r')->orderBy('r.nome', 'ASC');
                        return $qb;
                    },
                ))*/
                ->add('provincia', TextType::Class) /*EntityType::class, array(
                    'label' => 'Provincia',
                    'empty_data' => null,
                    'placeholder' => 'Seleziona Provincia',
                    'class' => 'AppBundle\Entity\province',
                    'choice_label' => 'nome',
                    'choice_value' => 'sigla_automobilistica',
                    'query_builder' => function (EntityRepository $repo) {
                        $qb = $repo->createQueryBuilder('r')->orderBy('r.nome', 'ASC');
                        return $qb;
                    },
                ))*/
                ->add('region', TextType::class) /*EntityType::class, array(
                    'label' => 'Region',
                    'empty_data' => null,
                    'placeholder' => 'Seleziona Regione',
                    'class' => 'AppBundle\Entity\regioni',
                    'choice_label' => 'nome',
                    'choice_value' => 'nome',
                    'query_builder' => function (EntityRepository $repo) {
                        $qb = $repo->createQueryBuilder('r')->orderBy('r.nome', 'ASC');
                        return $qb;
                    },
                ))*/
                ->add('video', HiddenType::class)
                ->add('objLevel', HiddenType::class)
                ->add('save', SubmitType::class, array('label' => 'Aggiungi Inserzione'))
                ->getForm();

            $form->handleRequest($request);

            if ($form->isSubmitted() && $form->isValid()) {
                $em = $this->getDoctrine()->getManager();
                /** @var Category $category */
                $category = $form->getData()->getCategory();
                $newAd->setCategory($category->getId());
                $em->persist($newAd);
                $em->flush();
                $video = new Videos();
                $video->setAid($newAd->getId());
                $video->setAccepted(false);
                $video->setUid($newAd->getUname());
                $video->setFilename($newAd->getVideo() ?? '');
                $video->setUploaded(false);
                $em->persist($video);
                if($form->getData()->getObjLevel() != null) {
                    $user = $this->getDoctrine()->getRepository(User::class)->find($this->getUser()->getId());
                    if($form->getData()->getObjLevel == 1) { $user->setCoinGold($user->getCoinGold() - 1); }
                    if($form->getData()->getObjLevel == 2) { $user->setCoinSilver($user->getCoinSilver() - 1); }
                    if($form->getData()->getObjLevel == 3) { $user->setCoinBronze($user->getCoinBronze() - 1); }
                    $em->flush();
                }
                $em->flush();

                $message = (new Swift_Message('Nuovo annuncio su VedoCompro'))
                    ->setFrom(['noreply@vedocompro.com' => 'VedoCompro'])
                    ->setTo(['alebibio@gmail.com','andreyodj@gmail.com'])
                    ->setBody('Hey, un nuovo annuncio è stato caricato e deve essere moderato.');
                $this->get('mailer')->send($message);

                return $this->redirectToRoute('profilo', array('query' => $usrName));
            }

            return $this->render('ads/add.html.twig', array(
                'form' => $form->createView(),
            ));
        } else {
            return $this->redirectToRoute('login');
        }
    }

    /**
     * @Route("/modifica/{id}", name="edit")
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     */
    public function editAction(Request $request,$id) {

        $ad = $this->getDoctrine()->getRepository(Ads::class)->find($id);

        $form = $this->createForm(AdsUserType::class, $ad);

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $mnrg = $this->getDoctrine()->getManager();
            $data = $request->request->all();

            $ad->setCategory($data['appbundle_ads']['category']);

            $mnrg->flush();

            $this->addFlash('success','Articolo aggiornato con successo');
        }

        return $this->render('ads/edit.html.twig',[
            'form' => $form->createView()
        ]);
    }


    /**
     * @Route("/promuovi/{id}", name="promote")
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function promoteAction(Request $request, $id)
    {
        /** @var User $user */
        $user = $this->get('security.token_storage')->getToken()->getUser();

        if ($request->getMethod() == 'POST') {
            $cointype = $request->request->get('cointype');
            $em = $this->get('doctrine.orm.entity_manager');
            /** @var Ads $ad */
            $ad = $em->getRepository('AppBundle:Ads')->find($id);
            if ($cointype == 'gold') {
                $date = clone $ad->getGoldPromotionEndDate() ?? new \DateTime();
                $ad->setGoldPromotionEndDate($date->modify('+7 day'));
                $user->setCreditsGold($user->getCreditsGold() - 1);
            } elseif ($cointype == 'silver') {
                $date = clone $ad->getSilverPromotionEndDate() ?? new \DateTime();
                $ad->setSilverPromotionEndDate($date->modify('+3 day'));
                $user->setCreditsSilver($user->getCreditsSilver() - 1);
            } else {
                $date = clone $ad->getBronzePromotionEndDate() ?? new \DateTime();
                $ad->setBronzePromotionEndDate($date->modify('+1 day'));
                $user->setCreditsBronze($user->getCreditsBronze() - 1);
            }
            $ad->setShowcase(1);
            $em->persist($ad);
            $em->persist($user);
            $em->flush();
            return $this->redirectToRoute('profilo', ['query' => $user->getName()]);
        }

        $credits = (int)$user->getCreditsGold() + (int)$user->getCreditsSilver() + (int)$user->getCreditsBronze();

        return $this->render(':ads:promote.html.twig', array(
            'id' => $id,
            'credits' => $credits,
            'creditsGold' => $user->getCreditsGold(),
            'creditsSilver' => $user->getCreditsSilver(),
            'creditsBronze' => $user->getCreditsBronze(),
        ));
    }

    /**
     * @Route("/delete/{id}", name="user_delete_ad")
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function userDeleteAdAction(Request $request, $id)
    {
        /** @var User $user */
        $user = $this->get('security.token_storage')->getToken()->getUser();
        $em = $this->get('doctrine.orm.entity_manager');
        /** @var Ads $ad */
        $ad = $em->getRepository('AppBundle:Ads')->find($id);

        if ($user->getId() == $ad->getUname()) {
            $ad = $em->getRepository('AppBundle:Ads')->find($id);
            if ($ad) $em->remove($ad);
            $video = $em->getRepository('AppBundle:Videos')->findOneBy(['aid' => $id]);
            if ($video) $em->remove($video);
            $em->flush();
        }

        return $this->redirectToRoute('profilo', ['query' => $user->getName()]);
    }

    /**
     * @Route("/acquisto/{package}", name="buy_now")
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function buyNowAction($package)
    {

        $usr = $this->get('security.token_storage')->getToken()->getUser();

        $currentBronze = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e.credits_bronze')
            ->where('e.id = :usr')
            ->setParameter('usr', $usr)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        $currentSilver = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e.credits_silver')
            ->where('e.id = :usr')
            ->setParameter('usr', $usr)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        $currentGold = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e.credits_gold')
            ->where('e.id = :usr')
            ->setParameter('usr', $usr)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $em = $this->getDoctrine()->getManager();
        $credit = $em->getRepository('AppBundle:User')->find($usr);

        switch ($package) {
            case 'bronzo':
                $credit->setCreditsBronze((int)$currentBronze[0]['credits_bronze'] + (int)5);
                $credits = 5;
                break;
            case 'argento':
                $credit->setCreditsSilver((int)$currentSilver[0]['credits_silver'] + (int)5);
                $credits = 5;
                break;
            case 'oro':
                $credit->setCreditsGold((int)$currentGold[0]['credits_gold'] + (int)5);
                $credits = 5;
        }

        $em->flush();

        return $this->render('buy/buy.success.html.twig', array(
            'credits' => $credits
        ));
    }

    /**
     * @Route("/errore_acquisto/", name="buy_error")
     */
    public function buyErrorAction()
    {
        return $this->render('buy/buy.cancel.html.twig');
    }

    /**
     * @Route("/promuovi/{type}/{id}", name="promuovi_tipo_id")
     */
    public function promoteTypeID($type, $id)
    {
        $promote = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.id = :id')
            ->andWhere('e.uid = :uid')
            ->andWhere('level != :level')
            ->setParameter('id', $id)
            ->setParameter('uid', $this->get('security.context')->getToken()->getUser())
            ->setParameter('level', $type)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

    }

//    /**
//     * @Route("/acquista/{id}", name="acquista_id")
//     */
//    public function buyAction($id)
//    {
//        $ads = $this->getDoctrine()
//            ->getRepository('AppBundle:Ads')
//            ->createQueryBuilder('e')
//            ->select('e')
//            ->where('e.id = :id')
//            ->setParameter('id', $id)
//            ->getQuery()
//            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
//
//
//        return $this->render('ads/buy.html.twig', array(
//            'ad' => $ads
//        ));
//    }
//
//    /**
//     * @Route("/acquista/{id}/conferma", name="acquista_conferma_id")
//     */
//    public function confirmBuyAction()
//    {
//        return $this->render('ads/buy.confirm.html.twig');
//    }
//
    public function convertCategory($catID)
    {
        $catName = $this->getDoctrine()
            ->getRepository('AppBundle:Category')
            ->createQueryBuilder('e')
            ->select('e.name')
            ->where('e.id = :id')
            ->setParameter('id', $catID)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        return $catName[0]["name"];
    }

    public function convertCategoryName($catname)
    {
        if ($catname != null) {
            $catName = $this->getDoctrine()
                ->getRepository('AppBundle:Category')
                ->createQueryBuilder('e')
                ->select('e.id')
                ->where('e.name = :name')
                ->setParameter('name', $catname)
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
            if ($catName != null) {
                return $catName[0]["id"];
            } else {
                $catName = $this->getDoctrine()
                    ->getRepository('AppBundle:Category')
                    ->createQueryBuilder('e')
                    ->select('e.id')
                    ->getQuery()
                    ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
                return $catName[0]["id"];
            }
        } else {
            $catName = $this->getDoctrine()
                ->getRepository('AppBundle:Category')
                ->createQueryBuilder('e')
                ->select('e.id')
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
            return $catName[0]["id"];
        }
    }

    /**
     * @Route("/ajax/stats/callClick/{type}/{id}", name="ajax_stats_call_click")
     */
    public function storeCallActionStat($type,$id) {
        $ad = $this->getDoctrine()->getRepository(Ads::class)->find($id);

        if ($type == 'call') {
            $ad->setCallClicks($ad->getCallClicks() + 1);
        } elseif ($type == 'message') {
            $ad->setMessageClicks($ad->getMessageClicks() + 1);
        }

        $mnrg = $this->getDoctrine()->getManager();

        $mnrg->flush();

        $response = new Response();
        $response->setStatusCode(Response::HTTP_OK);

        return $response->setContent('Ok');
    }

    public function getCategoriesName()
    {
        $category = $this->getDoctrine()
            ->getRepository('AppBundle:Category')
            ->createQueryBuilder('e')
            ->select('e.name')
            ->getQuery()
            ->getResult();
        return $category[0]['name'];
    }

    public function getCategoriesID()
    {
        $category = $this->getDoctrine()
            ->getRepository('AppBundle:Category')
            ->createQueryBuilder('e')
            ->select('e.id')
            ->getQuery()
            ->getResult();
        return $category[0]['id'];
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

    public function convertUname($userID)
    {
        $uname = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e.name')
            ->where('e.id = :id')
            ->setParameter('id', $userID)
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);
        return $uname[0]['name'];
    }

    public function getUserPic($userID)
    {
        $uname = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e.pic')
            ->where('e.id = :id')
            ->setParameter('id', $userID)
            ->getQuery()
            ->getResult(Query::HYDRATE_ARRAY);
        return $uname[0]['pic'];
    }

    public function undash($string)
    {
        return preg_replace('/\-\//', '?', $string);
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