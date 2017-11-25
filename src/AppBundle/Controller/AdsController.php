<?php

namespace AppBundle\Controller;

use AppBundle\Entity\Category;
use AppBundle\Entity\User;
use AppBundle\Entity\Videos;
use Doctrine\ORM\EntityRepository;
use Doctrine\ORM\Query;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\MoneyType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use JMS\SecurityExtraBundle\Annotation\Secure;
use AppBundle\Entity\Ads;
use Symfony\Component\Finder\Finder;


class AdsController extends Controller
{
    /**
     * @Route("annuncio/{category}/{item}/{title}", name="vedi_oggetto")
     * @param $category
     * @param $item
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function showAction($category, $item)
    {
        
        $ad = $this->getDoctrine()
        ->getRepository('AppBundle:Ads')
        ->findBy(array('id' => $item));

        $video = $this->getDoctrine()
            ->getRepository('AppBundle:Videos')
            ->findOneBy(array('aid' => $item));

        $id = $item;

        if($ad != null) {

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
            $viewsVal = $current + 1;

            $em = $this->getDoctrine()->getManager();
            $conn = $em->getConnection();
            $query = ("UPDATE `ads` SET `views` = :newViews WHERE `ads`.`id` = :adID;");
            $stmt = $conn->prepare($query);
            $stmt->bindParam('newViews', $viewsVal);
            $stmt->bindParam('adID', $adID);
            $stmt->execute();

            $em = $this->getDoctrine()->getManager();
            $em->flush();


            $finder = new Finder();
            $finder->files()
                ->name($item . '-*.jpg')
                ->in(__DIR__ . '/../../../web/uploads/photos/');

            $photos = array();
            foreach ($finder as $file) {
                $photos[] = $file->getRelativePathname();
            }

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

            return $this->render('ads/view.html.twig', [
                'ad_info' => $ad,
                'video' => $video,
                'photos' => $photos,
                'ad_category' => $category,
                'user_info' => $seller,
                'feed_percent' => $feedPercent,
                'is_wish' => $isWhish,
                'similar' => $similar,
                'ads' => $this
            ]);
        } else {
            return $this->redirectToRoute('error',array('error'=>'02-001'));
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
            $newAd->setObjLevel(0);
            $newAd->setShowcase(0);
            $newAd->setSold(0);
            $newAd->setTrackingCode('');

            $form = $this->createFormBuilder($newAd)
                //*->add('video', FileType::class, array('attr' => array('class' => 'dropzone')))**/
                ->add('name', TextType::class, array('label' => 'Nome', 'attr' => array('class' => 'required')))
                ->add('description', TextareaType::class, array('attr' => array('rows' => '5'), 'label' => 'Descrizione'))
                ->add('category', EntityType::class, array(
                    'class' => 'AppBundle:Category',
                    'placeholder' => 'Scegli Categoria',
                    'empty_data' => null,
                    'required' => true,
                    'label' => 'Categoria'))
                ->add('price', MoneyType::class, array('label' => 'Prezzo'))
                ->add('objCondition', ChoiceType::class, array('label' => 'Condizione', 'choices' => array(
                    'Nuovo' => 'Nuovo',
                    'Usato' => 'Usato',
                    'Ricondizionato' => 'Ricondizionato',
                    'Non Funzionante' => 'Non Funzionante'
                ),))
                ->add('location', TextType::class, array('label' => 'Dove si trova'))
                ->add('region', TextType::class, array('label' => 'Regione'))
                /**->add('option1',TextType::class, array('label' => 'Chilometraggio'))
                 * ->add('option2',TextType::class, array('label' => 'Anno'))
                 * ->add('option3',TextType::class, array('label' => 'Proprietari'))
                 * ->add('option4',TextType::class, array('label' => 'Targa'))
                 * ->add('option5',TextType::class)**/
                ->add('video', HiddenType::class)
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
                $em->flush();
                return $this->redirectToRoute('profilo', array('query' => $usrName));
            }

            return $this->render('ads/add.html.twig', array(
                'form' => $form->createView(),
            ));
        }  else {
            return $this->redirectToRoute('login');
    }
}
    /**
     * @Route("/promuovi", name="promote")
     * @Secure(roles="IS_AUTHENTICATED_FULLY")
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function promoteAction(Request $request)
    {

        /** @var User $user */
        $user = $this->get('security.token_storage')->getToken()->getUser();

        $ads = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.uname = :usr')
            ->setParameter('usr', $user->getId())
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $credits = (int)$user->getCreditsGold() + (int)$user->getCreditsSilver() + (int)$user->getCreditsBronze();

        return $this->render(':ads:promote.html.twig', array(
            'ads' => $ads,
            'credits' => $credits,
            'creditsGold' => $user->getCreditsGold(),
            'creditsSilver' => $user->getCreditsSilver(),
            'creditsBronze' => $user->getCreditsBronze(),
        ));
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
    public function buyErrorAction() {
        return $this->render('buy/buy.cancel.html.twig');
    }

    /**
     * @Route("/promuovi/{type}/{id}", name="promuovi_tipo_id")
     */
    public function promoteTypeID($type,$id)
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
                        ->setParameter('level',$type)
                        ->getQuery()
                        ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

    }

    /**
     * @Route("/acquista/{id}", name="acquista_id")
     */
    public function buyAction($id)
    {
        $ads = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);


        return $this->render('ads/buy.html.twig', array(
            'ad' => $ads
        ));
    }

    /**
     * @Route("/acquista/{id}/conferma", name="acquista_conferma_id")
     */
    public function confirmBuyAction()
    {
        return $this->render('ads/buy.confirm.html.twig');
    }

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

    public function getCategoriesName() {
        $category = $this->getDoctrine()
            ->getRepository('AppBundle:Category')
            ->createQueryBuilder('e')
            ->select('e.name')
            ->getQuery()
            ->getResult();
        return $category[0]['name'];
    }
    public function getCategoriesID() {
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
    public function undash($string) {
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