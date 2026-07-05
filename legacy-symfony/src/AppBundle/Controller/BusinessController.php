<?php

namespace AppBundle\Controller;

use AppBundle\Entity\Ads;
use AppBundle\Entity\BusinessRequests;
use AppBundle\Entity\BusinessStats;
use AppBundle\Entity\Category;
use AppBundle\Entity\comuni;
use AppBundle\Form\AdsBusinessType;
use AppBundle\Form\AdsType;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;


class BusinessController extends Controller {

    /**
     * @Route("business/pacchetti/", name="business_pacchetti")
     */
    public function businessPackageAction(Request $request) {
        return $this->render('business/default.html.twig');
    }

    /**
     * @Route("business/scopri", name="business_scopri")
     */
    public function businessScopri() {
        return$this->render('business/default.html.twig');
    }

    /**
     * @Route("business/acquista/{package}", name="business_package")
     */
    public function businessBuyAction(Request $request, $package) {

        $businessRequest = new BusinessRequests();

        $form = $this->createFormBuilder($businessRequest)
            ->add('package', HiddenType::class, [
                'data' => $package
            ])
            ->add('opt1', CheckboxType::class, [
                'label' => 'Montaggio Video ( + 10,00 €/mese )',
                'attr' => [
                    'class' => 'custom-checkbox'
                ]
            ])
            ->add('opt2', CheckboxType::class, [
                'label' => 'Riprese con Drone ( + 20,00 €/mese )',
                'attr' => [
                    'class' => 'custom-checkbox'
                ]
            ])
            ->add('legalName', TextType::class, [
                'label' => 'Ragione Sociale'
            ])
            ->add('vatNumber', TextType::class, [
                'label' => 'Partita IVA'
            ])
            ->add('contactName', TextType::class, [
                'label' => 'Nome contatto'
            ])
            ->add('contactSurname', TextType::class, [
                'label' => 'Cognome contatto'
            ])
            ->add('contactPhone', TextType::class, [
                'label' => 'Telefono contatto'
            ])
            ->add('contactEmail', TextType::class, [
                'label' => 'Email contatto'
            ])
            ->getForm();

        return $this->render("business/package.html.twig", [
            'package' => $package,
            'form' => $form->createView()
        ]);
    }

    /**
     * @Route("business/apply/receive", name="business_ajax_apply")
     */
    public function businessAjaxApply(Request $request) {

        $data = $request->request->get('request');

        $req = new BusinessRequests();

        $req->setUid($this->getUser()->getId());
        $req->setPackage($data->getData()->get('package'));
        $req->setRequestDate(new \DateTime("now"));
        $req->setLegalName($data->get('legalName'));

        dump($data);

        return new Response($data);
    }

    /**
     * @Route("business/dashboard", name="business_dashboard")
     */
    public function businessDashboard() {
        return $this->render('business/dashboard/index.html.twig', [
            'adsCount' => count($this->getDoctrine()->getRepository(Ads::class)->findBy(['uname' => $this->getUser()->getId()]))
        ]);
    }

    /**
     * @Route("business/dashboard/annunci/lista", name="business_dashboard_annunci_lista")
     */
    public function businessDashboardAdsList() {
        return $this->render('business/dashboard/ads/list.html.twig', [
            'ads' => $this->getDoctrine()->getRepository(Ads::class)->findBy(['uname' => $this->getUser()->getID()]),
            'fun' => $this
        ]);
    }

    /**
     * @Route("business/dashboard/annunci/vedi/{id}", name="business_dashboard_annunci_vedi")
     */
    public function businessDashboardAdsView($id) {
        return $this->render('business/dashboard/ads/view.html.twig', [
            'ad' => $this->getDoctrine()->getRepository(Ads::class)->find($id),
            'fun' => $this
        ]);
    }

    /**
     * @Route("business/dashboard/annunci/add", name="business_dashboard_annunci_aggiungi")
     */
    public function businessDashboardAdsAdd() {

        $ad = New Ads();

        $form = $this->createForm(AdsBusinessType::class,$ad)
        ->add('video', FileType::class);

        return $this->render('business/dashboard/ads/add.html.twig', [
            'form' => $form->createView()
        ]);
    }

    /**
     * @Route("business/dashboard/annunci/modifica/{id}", name="business_dashboard_annunci_modifica")
     */
    public function businessDashboardAdsEdit($id, Request $request) {

        $ad = $this->getDoctrine()->getRepository(Ads::class)->find($id);
        $cat = $this->getDoctrine()->getRepository(Category::class)->find($ad->getCategory());

        $form = $this->createForm(AdsBusinessType::class,$ad);

        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $mnrg = $this->getDoctrine()->getManager();
            $data = $request->request->all();

            $ad->setCategory($data['appbundle_ads']['category']);

            $mnrg->flush();

            $this->addFlash('success','Articolo aggiornato con successo');
        }

        return $this->render('business/dashboard/ads/edit.html.twig', [
            'form' => $form->createView()
        ]);
    }

    /**
     * @Route("business/dashboard/statistiche/", name="business_dashboard_statistiche")
     */
    public function businessDashboardStats() {

        //$stats = $this->getDoctrine()->getRepository(BusinessStats::class)->findBy(['uid' => $this->getUser()->getId()]);

        $stats = $this->getDoctrine()->getManager()
                      ->getRepository(BusinessStats::class)
                      ->createQueryBuilder('i')
                      ->select('COUNT(DISTINCT i.id), i.adid, i.uid, i.type, MONTH(i.datetime) AS sMonth')
                      ->where("i.uid = " . $this->getUser()->getId())
                      ->groupBy('sMonth')
                      ->getQuery()
                      ->getResult();

        /*for ($i=0; $i < count($stats); $i++) {
            $dateObj   = DateTime::createFromFormat('!m', $stats[$i]['sMonth']);
            $stats = $dateObj->format('F'); // March
        }*/



        return $this->render('business/dashboard/stats/all.html.twig', [
            'stats' => $stats,
            'ads' => $this->getDoctrine()->getRepository(Ads::class)->findBy(['uname' => $this->getUser()->getID()]),
            'fun' => $this,
        ]);
    }

    /**
     * @Route("business/dashboard/sottoscrizione", name="business_dashboard_subscription")
     */
    public function businessDashboardSubscription() {

        $user = $this->getUser();

        return $this->render('business/dashboard/subscription/subscription.html.twig',[
            'user' => $user
        ]);
    }

    /**
     * Returns a JSON string with the neighborhoods of the City with the providen id.
     *
     * @param Request $request
     * @return JsonResponse
     * @Route("/utils/json/listComuni", name="utils_json_listcomuni")
     */
    public function listComuni(Request $request)
    {
        // Get Entity manager and repository
        $em = $this->getDoctrine()->getManager();
        $neighborhoodsRepository = $em->getRepository(comuni::class);

        // Search the neighborhoods that belongs to the city with the given id as GET parameter "cityid"
        $neighborhoods = $neighborhoodsRepository->createQueryBuilder("q")
            ->where("q.regione = :cityid")
            ->setParameter("cityid", $request->query->get("cityid"))
            ->getQuery()
            ->getResult();

        // Serialize into an array the data that we need, in this case only name and id
        // Note: you can use a serializer as well, for explanation purposes, we'll do it manually
        $responseArray = array();
        foreach($neighborhoods as $neighborhood){
            $responseArray[] = array(
                "id" => $neighborhood->getId(),
                "name" => $neighborhood->getComune()
            );
        }

        // Return array with structure of the neighborhoods of the providen city id
        return new JsonResponse($responseArray);

        // e.g
        // [{"id":"3","name":"Treasure Island"},{"id":"4","name":"Presidio of San Francisco"}]
    }

    public function convertCategory($id) {
        return $this->getDoctrine()->getRepository(Category::class)->findOneBy(['id' => $id])->getName();
    }
}