<?php

namespace AppBundle\Controller;

use AppBundle\Entity\Ads;
use AppBundle\Entity\BusinessRequests;
use AppBundle\Entity\BusinessStats;
use AppBundle\Entity\Category;
use AppBundle\Form\AdsBusinessType;
use AppBundle\Form\AdsType;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Form\Extension\Core\Type\CheckboxType;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
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
    public function businessDashboardAdsEdit($id) {

        $ad = $this->getDoctrine()->getRepository(Ads::class)->find($id);

        $form = $this->createForm(AdsBusinessType::class,$ad);

        return $this->render('business/dashboard/ads/edit.html.twig', [
            'form' => $form->createView()
        ]);
    }

    /**
     * @Route("business/dashboard/statistiche/", name="business_dashboard_statistiche")
     */
    public function businessDashboardStats() {

        $stats = $this->getDoctrine()->getRepository(BusinessStats::class)->findBy(['uid' => $this->getUser()->getId()]);

        foreach($stats as $stat) {
            
        }



        return $this->render('business/dashboard/stats/all.html.twig', [
            'stats' => $stats
        ]);
    }

    public function convertCategory($id) {
        return $this->getDoctrine()->getRepository(Category::class)->findOneBy(['id' => $id])->getName();
    }
}