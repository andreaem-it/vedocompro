<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 01/08/17
 * Time: 15:55
 */

namespace AppBundle\Controller;

use AppBundle\Entity\HelpDesk;
use AppBundle\Form\HelpDeskType;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\HttpFoundation\Request;

class HelpController extends Controller
{
    /**
     * @Route("/helpdesk/", name="helpdesk")
     */
    public function helpdeskAction() {
        if (!$this->get('security.authorization_checker')->isGranted('ROLE_USER')) {
            throw $this->createAccessDeniedException('GET OUT!');
        } else {
        $currentUser = $this->get('security.token_storage')->getToken()->getUser()->getID();

        $ticketsO = $this->getDoctrine()->getManager()->getRepository('AppBundle:HelpDesk')->createQueryBuilder('e')->select('e')->where('e.uid = :uid')->setParameter('uid',$currentUser)->andWhere('e.closed = 0')->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);;
        $ticketsOCount = count($ticketsO);
        $ticketsC = $this->getDoctrine()->getManager()->getRepository('AppBundle:HelpDesk')->createQueryBuilder('e')->select('e')->where('e.uid = :uid')->setParameter('uid',$currentUser)->andWhere('e.closed = 1')->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);;
        $ticketsCCount = count($ticketsC);

        return $this->render('help/help.html.twig', array(
            'ticketsO' => $ticketsO,
            'ticketsOCount' => $ticketsOCount,
            'ticketsC' => $ticketsC,
            'ticketsCCount' => $ticketsCCount
        ));
    }}

    /**
     * @Route("/helpdesk/ticket/{id}", name="helpdesk_ticket")
     */
    public function helpdeskViewAction($id) {

        $ticket = $this->getDoctrine()->getManager()->getRepository('AppBundle:HelpDesk')->createQueryBuilder('e')->select('e')->where('e.id = :id')->setParameter('id', $id)->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        $replies = $this->getDoctrine()->getManager()->getRepository('AppBundle:HelpDesk')->createQueryBuilder('r')->select('r')->where('r.isReply = 1')->andWhere('r.parent_m = :id')->setParameter('id', $id)->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render('help/help.view.html.twig', array(
            'ticket' => $ticket,
            'replies' => $replies,
            'tools' => $this
        ));
    }

    /**
     * @Route("/helpdesk/apri_ticket", name="helpdesk_apri")
     */
    public function helpdeskNewAction(Request $request) {

        $entity = new HelpDesk();

        $form = $this->createFormBuilder($entity)
            ->add('title',TextType::class,array(
                'label' => 'Titolo',
                'attr' => array('class' => 'form-control')
            ))
            ->add('type',ChoiceType::class, array(
                'choices' => array(
                    'Scegli...' => '',
                    'Assistenza con il sito' => '1',
                    'Problema con utente' => '2',
                    'Problema con un inserzione' => '3',
                    'Errore generico' => '4'
                )
            ))
            ->add('message', TextType::class, array(
                'label' => 'Messaggio',
                'attr' => array('class' => 'form-control')
            ))
            ->add('submit',SubmitType::class, array(
                'label' => 'Apri Ticket',
                'attr' => array('class' => 'btn-success')
            ))
            ->getForm();

        $form->handleRequest($request);

        if($form->isSubmitted() && $form->isValid()) {
            $data = new \DateTime('now');
            $currentUser = $this->get('security.token_storage')->getToken()->getUser()->getID();

            $entity->setUid($currentUser);
            $entity->setTimest($data);
            $entity->setClosed('0');
            $entity->setIsReply('0');
            $entity->setParentM('0');
            $entity->setReplyTo('0');

            $em = $this->getDoctrine()->getManager();
            $em->persist($entity);
            $em->flush();

            return $this->redirectToRoute('helpdesk');
        }

        return $this->render('help/help.create.html.twig', array(
            'form' => $form->createView())
        );
    }

    public function convertHelpType($type) {
        switch ($type) {
            case '1':
                return 'Assistenza con il sito';
                break;
            case '2':
                return 'Problema con utente';
                break;
            case '3':
                return "Problema con un'inserzione";
                break;
            case '4':
                return 'Errore generico';
                break;
            default:
                return 'Non Categorizzato';
                break;
        }
    }

    public function convertStatus($type) {
        switch ($type) {
            case '0':
                return 'Aperto';
                break;
            case '1':
                return 'Chiuso';
                break;
            case '2':
                return 'Assegnato';
                break;
            case '3':
                return 'In Attesa di Risposta Utente';
                break;
            default:
                return 'Sconosciuto';
                break;
        }
    }
}