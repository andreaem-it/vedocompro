<?php

namespace AppBundle\Controller;

use Doctrine\ORM\EntityRepository;
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
     * @Route("cerca/{query}", name="search")
     * @param $query
     * @return Response
     * @internal param Request $request
     */
    public function searchAction($query)
    {
        $results = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->where("p.name LIKE '%$query%'")
            ->orderBy("p.obj_level", 'DESC')
            ->orderBy("p.updatetime", 'DESC')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $showcase = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->where("p.showcase = 1")
            ->orderBy("p.creationtime", 'DESC')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render('search\search.html.twig', [
            //'pagination'=>$pagination,
            'query' => $query,
            'region' => 'Italia',
            'results' => $results,
            'search' => $this,
            'showcase' => $showcase
        ]);
    }

    /**
     * @Route("cerca", name="search_all")
     */
    public function searchall() {
        $showcase = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->where("p.showcase = 1")
            ->andWhere("p.published = 1")
            ->orderBy("p.creationtime", 'DESC')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $results = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->select('p')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $region = 'Italia';
        return $this->render('search/search.html.twig', [
            'region' => $region,
            'query' => 'Tutto',
            'results' => $results,
            'search' => $this,
            'showcase' => $showcase
        ]);
    }

    /**
     * @Route("cerca/{region}/{query}", name="search_regioni", defaults={"query"=0})
     * @param $region
     * @param $query
     * @return Response
     */
    public function searchRegionAction($region, $query)
    {
        $showcase = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->where("p.showcase = 1")
            ->orderBy("p.creationtime", 'DESC')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

            if ($query == 'tutto' && $region != '1') {
                $results = $this->getDoctrine()
                    ->getRepository('AppBundle:Ads')
                    ->createQueryBuilder('p')
                    ->where("p.region Like '%$region%'")
                    ->andWhere("p.published = 1")
                    ->getQuery()
                    ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

                $region = ucfirst($region);
                return $this->render('search/search.html.twig', [
                    'region' => $region,
                    'query' => $query,
                    'results' => $results,
                    'search' => $this,
                    'showcase' => $showcase
                ]);
            } elseif ($region == 'Tutta Italia') {
                $results = $this->getDoctrine()
                    ->getRepository('AppBundle:Ads')
                    ->createQueryBuilder('p')
                    ->where("p.name Like '%$query%'")
                    ->andWhere("p.published = 1")
                    ->getQuery()
                    ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

                $region = ucfirst($region);
                return $this->render('search/search.html.twig', [
                    'region' => $region,
                    'query' => $query,
                    'results' => $results,
                    'search' => $this,
                    'showcase' => $showcase
                ]);
            } else {
                $results = $this->getDoctrine()
                    ->getRepository('AppBundle:Ads')
                    ->createQueryBuilder('p')
                    ->where("p.name LIKE '%$query%'")
                    ->andWhere("p.region Like '%$region%'")
                    ->andWhere("p.published = 1")
                    ->getQuery()
                    ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

                $region = ucfirst($region);
                return $this->render('search/search.html.twig', [
                    'region' => $region,
                    'query' => $query,
                    'results' => $results,
                    'search' => $this,
                    'showcase' => $showcase
                ]);
            }
        }


    /**
     * @Route("cerca/{region}", name="search_regioni_all")
     * @param $region
     * @return Response
     */
    public function searchRegionAllAction($region)
    {
        $showcase = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->where("p.showcase = 1")
            ->andWhere("p.published = 1")
            ->orderBy("p.creationtime", 'DESC')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $results = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->where("p.region Like '%$region%'")
            ->andWhere("p.published = 1")
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $region = ucfirst($region);
        return $this->render('search/search.html.twig', [
            'region' => $region,
            'query' => 'Tutto',
            'results' => $results,
            'search' => $this,
            'showcase' => $showcase
        ]);
    }

    /**
     * @Route("cerca/{category}/{region}/{query}", name="search_categorie_regioni", defaults={"category"=1,"region"=1,"query"="0"})
     * @param $category
     * @param $region
     * @param $query
     * @return Response
     */
    public function searchCategoryRegionAction($category, $region, $query)
    {
        $showcase = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->where("p.showcase = 1")
            ->andWhere("p.published = 1")
            ->orderBy("p.creationtime", 'DESC')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        if($category == 0 ) {
            $results = $this->getDoctrine()
                ->getRepository('AppBundle:Ads')
                ->createQueryBuilder('p')
                ->where("p.name LIKE '%$query%'")
                ->andWhere("p.region Like '%$region%'")
                ->andWhere("p.published = 1")
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
            $category = "Tutte le categorie";
        } elseif ($region == 1) {
            $results = $this->getDoctrine()
                ->getRepository('AppBundle:Ads')
                ->createQueryBuilder('p')
                ->where("p.name LIKE '%$query%'")
                ->andWhere("p.category Like '%$category%'")
                ->andWhere("p.published = 1")
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
            $region = 'Tutta Italia';
        } elseif ($category == 0 && $region == 1) {
            $results = $this->getDoctrine()
                ->getRepository('AppBundle:Ads')
                ->createQueryBuilder('p')
                ->where("p.name LIKE '%$query%'")
                ->andWhere("p.published = 1")
                ->orderBy("p.obj_level", 'DESC')
                ->orderBy("p.updatetime", 'DESC')
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
            $region = 'Tutta Italia';
            $category = "Tutte le categorie";
        } else {
            $results = $this->getDoctrine()
                ->getRepository('AppBundle:Ads')
                ->createQueryBuilder('p')
                ->where("p.name LIKE '%$query%'")
                ->andWhere("p.region LIKE '%$region%'")
                ->andWhere("p.category LIKE '%$category%'")
                ->andWhere("p.published = 1")
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        }
        $category = ucfirst($category);
        $region = ucfirst($region);
        return $this->render('search/search.html.twig', [
            'region' => $region,
            'category' => $category,
            'query' => $query,
            'results' => $results,
            'search' => $this,
            'showcase' => $showcase
        ]);
    }

    /**
     * @Route("cerca/{category}/{query}", name="search_categorie")
     * @param $category
     * @param $query
     * @return Response
     */
    public function searchCategoryAction($category, $query)
    {
        $showcase = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->where("p.isShowcase = 1")
            ->andWhere("p.published = 1")
            ->orderBy("p.creationtime", 'DESC')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $results = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('p')
            ->where("p.name LIKE '%$query%'")
            ->andWhere("p.category Like '%$category%'")
            ->andWhere("p.published = 1")
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $category = ucfirst($category);
        return $this->render('search/search.html.twig', [
            'region' => 'Italia',
            'category' => $category,
            'query' => $query,
            'results' => $results,
            'search' => $this,
            'showcase' => $showcase
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
                ->add('name', TextType::class, array('label'=> 'Cerca'))
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
                ->add('obj_level',ChoiceType::class, array(
                    'choices' => array(
                        'Visualizza Tutto' => '0',
                        'Prodotti Oro' => '1',
                        'Prodotti Argento' => '2',
                        'Prodotti Bronzo' => '3'
                    )
                ))
                ->add('submit',SubmitType::class, array('label' => 'Search','attr' => array('class' => 'btn-success')))
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
                'label'=> 'Cerca',
                'attr' => array(
                    'placeholder' => 'Es: Appartamento, Chitarra, Automobile',
                    'style' => 'width:100%',
                    'required' => false)))
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
                'style' => 'width:100%')))
            ->add('region', EntityType::class, array(
                'class' => 'AppBundle\Entity\Regions',
                'query_builder' => function (EntityRepository $repo) {
                    $er = $repo->createQueryBuilder('r');
                    return $er;
                },
                'label' => 'Region',
                'attr' => array(
                    'style' => 'width:100%')))
            ->add('submit',SubmitType::class, array('label' => 'Search','attr' => array('class' => 'btn-success btn-block btn-lg')))
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
    public function processSearch() {
    if(isset($_POST['form']['submit'])) {

        $category = $_POST['form']['category'];
        $region = $this->convertRegion($_POST['form']['region']);
        $query = $_POST['form']['name'];
        if ($category == '0' && $region == '1' && $query == null) {
            return $this->redirect('cerca');
        }
        elseif ($category == '0' && $region == '1') {
            //return $this->render('search/search.html.twig',['query' => $query]);
            return $this->redirectToRoute('search', ['query' => $query]);
        }
        elseif ($category != '0' && $region == '1') {
            //return $this->render($this->searchCategoryAction($category,$query));
            return $this->redirectToRoute('search_categorie', ['query' => $query, 'category' => $category]);
        }
        elseif ($category == '0' && $region != '1' && $query != null) {
            //return $this->render($this->searchRegionAction($region,$query));
            return $this->redirectToRoute('search_regioni', ['query' => $query, 'region' => $region]);
        }
        elseif ($category != '0' && $region != '1') {
            //return $this->render($this->searchCategoryRegionAction($category,$region,$query));
            return $this->redirectToRoute('search_categorie_regioni', ['query' => $query, 'region' => $region, 'category' => $category]);
        }
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