<?php

namespace AppBundle\Controller;

use Doctrine\ORM\EntityRepository;
use Doctrine\ORM\QueryBuilder;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use AppBundle\Entity\Ads;

class SearchController extends Controller
{

    /**
     * @Route("cerca", name="search")
     * @param $request
     * @return Response
     */
    public function searchAction(Request $request)
    {
        /** @var QueryBuilder $searchQuery */
        $searchQuery = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->andWhere("p.published = 1")
            ->andWhere("p.showcase = 0")
            ->orderBy("p.creationtime", 'DESC');

        /** @var QueryBuilder $qb */
        $qb = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p');

        /** @var QueryBuilder $showcaseQuery */
        $showcaseQuery = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->andWhere("p.published = 1")
            ->andWhere("p.showcase = 1")
            ->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->gt('p.goldPromotionEndDate', ':currentdate'),
                    $qb->expr()->gt('p.silverPromotionEndDate', ':currentdate'),
                    $qb->expr()->gt('p.bronzePromotionEndDate', ':currentdate')
                )
            )
            ->setParameter('currentdate', new \DateTime())
            ->orderBy("p.goldPromotionEndDate", 'DESC')
            ->orderBy("p.silverPromotionEndDate", 'DESC')
            ->orderBy("p.bronzePromotionEndDate", 'DESC');

        if ($request->query->get('categoria') && $request->query->get('categoria') != 0) {
            $searchQuery
                ->andWhere("p.category = :category")
                ->setParameter('category', $request->query->get('categoria'));
            $showcaseQuery
                ->andWhere("p.category = :category")
                ->setParameter('category', $request->query->get('categoria'));

            // TODO - change to actually get category name
            $category = ucfirst($request->query->get('categoria'));
        } else {
            $category = "Tutte le categorie";
        }

        if ($request->query->get('regione') && $request->query->get('regione') != "Tutta Italia") {
            $searchQuery
                ->andWhere("p.region = :region")
                ->setParameter('region', $request->query->get('regione'));
            $showcaseQuery
                ->andWhere("p.region = :region")
                ->setParameter('region', $request->query->get('regione'));

            // TODO - change to actually get category name
            $region = ucfirst($request->query->get('regione'));
        } else {
            $region = "Tutta Italia";
        }

        if ($request->query->get('q') && $request->query->get('q') != "") {
            $searchQuery
                ->andWhere("p.name LIKE :q")
                ->setParameter('q', '%' . $request->query->get('q') . '%');
            $showcaseQuery
                ->andWhere("p.name LIKE :q")
                ->setParameter('q', '%' . $request->query->get('q') . '%');
            $q = $request->query->get('q');
        } else {
            $q = 'Tutto';
        }

        $searchResults = $searchQuery
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        $showcaseResults = $showcaseQuery
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render('search/search.html.twig', [
            'region' => $region,
            'category' => $category,
            'query' => $q,
            'results' => $searchResults,
            'search' => $this,
            'showcase' => $showcaseResults
        ]);
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

    /**
     * @param Request $request
     * @return array|Response
     */
    public function formAction(Request $request)
    {
        $entity = new Ads();

        $form = $this->createFormBuilder($entity)
            ->add('name', TextType::class, array('label' => 'Cerca'))
            ->add('category', EntityType::class, array(
                'class' => 'AppBundle\Entity\Category',
                'group_by' => 'parentName',
                'query_builder' => function (EntityRepository $repo) {
                    $qb = $repo->createQueryBuilder('l');
                    $qb->andWhere('l.parent IS NOT NULL');
                    return $qb;
                },
                'label' => 'Category'))
            ->add('region', EntityType::class, array(
                'class' => 'AppBundle\Entity\Regions',
                'query_builder' => function (EntityRepository $repo) {
                    $er = $repo->createQueryBuilder('r');
                    return $er;
                },
                'label' => 'Region'))
            ->add('obj_level', ChoiceType::class, array(
                'choices' => array(
                    'Visualizza Tutto' => '0',
                    'Prodotti Oro' => '1',
                    'Prodotti Argento' => '2',
                    'Prodotti Bronzo' => '3'
                )
            ))
            ->add('submit', SubmitType::class, array('label' => 'Search', 'attr' => array('class' => 'btn-success')))
            ->getForm();

        return $this->render(
            ':search:form.search.sidebar.html.twig',
            array(
                'form' => $form->createView()
            ));
    }

    /**
     * @param Request $request
     * @return array|Response
     *
     */
    public function formTopAction(Request $request)
    {
        $entity = new Ads();

        $form = $this->createFormBuilder($entity)
            ->setAction($this->generateUrl('searchform'))
            ->setMethod('POST')
            ->add('name', TextType::class, array(
                'label' => 'Cerca',
                'attr' => array(
                    'placeholder' => 'Cosa cerchi?',
                    'class' => 'form-control-plaintext',
                    'style' => 'width:100%;border-bottom:2px solid #BBB;border-radius:0px;border-top:none')))
            ->add('category', EntityType::class, array(
                'class' => 'AppBundle\Entity\Category',
                'group_by' => 'parentName',
                'query_builder' => function (EntityRepository $repo) {
                    $qb = $repo->createQueryBuilder('l');
                    $qb->andWhere('l.parent IS NOT NULL');
                    return $qb;
                },
                'label' => 'Category',
                'attr' => array(
                    'class' => 'form-control form-control-plaintext form-control-select',
                    'style' => 'width:100%;border-left:none;border-right:none;border-top:none;border-radius:0px')))
            ->add('region', EntityType::class, array(
                'class' => 'AppBundle\Entity\Regions',
                'query_builder' => function (EntityRepository $repo) {
                    $er = $repo->createQueryBuilder('r');
                    return $er;
                },
                'label' => 'Region',
                'attr' => array(
                    'class' => 'form-control form-control-plaintext form-control-select',
                    'style' => 'width:100%;border-left:none;border-right:none;border-top:none;border-radius:0px')))
            ->add('submit', SubmitType::class, array('label' => 'Search', 'attr' => array('class' => 'btn btn-primary btn-block btn-lg color-light-blue btn-find')))
            ->getForm();

        $request = Request::createFromGlobals();
        $form->handleRequest($request);

        return $this->render(
            ':search:form.search.top.html.twig',
            array(
                'form' => $form->createView()
            ));
    }

    /**
     * @Route ("search",name="searchform")
     */
    public function processSearch()
    {
        if (isset($_POST['form']['submit'])) {
            $category = $_POST['form']['category'];
            $regionParam = $_POST['form']['region'];
            $region = $this->convertRegion($regionParam);
            $query = $_POST['form']['name'];
            return $this->redirectToRoute('search', ['q' => $query, 'categoria' => $category, 'regione' => $region]);
        }
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

    public function convertRegion($regionID)
    {
        $name = $this->getDoctrine()
            ->getRepository('AppBundle:Regions')
            ->createQueryBuilder('e')
            ->select('e.name')
            ->where('e.id = :id')
            ->setParameter('id', $regionID)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        return $name[0]["name"];
    }
}