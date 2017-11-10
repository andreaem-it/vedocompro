<?php

namespace AppBundle\Controller;

use AppBundle\Form\UserType;
use AppBundle\Entity\User;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Validator\Constraints\DateTime;
use Doctrine\ORM\QueryBuilder;

class AuthController extends Controller
{
    /**
     * @Route("login/", name="login")
     */
    public function loginAction(Request $request)
    {
        $authenticationUtils = $this->get('security.authentication_utils');

        // get the login error if there is one
        $error = $authenticationUtils->getLastAuthenticationError();
    
        // last username entered by the user
        $lastUsername = $authenticationUtils->getLastUsername();
        
        return $this->render('auth/login.html.twig', array(
            'last_username' => $lastUsername,
            'error'         => $error,
        ));
    }
    
    /**
     * @Route("logout/", name="logout")
     */
    public function logoutAction(Request $request)
    {
        $session = $request->getSession();
    
        // get the login error if there is one
        $error = $session->get(SecurityContextInterface::AUTHENTICATION_ERROR);
        $session->remove(SecurityContextInterface::AUTHENTICATION_ERROR);
    
        return array(
            // last username entered by the user
            'last_username' => $session->get(SecurityContextInterface::LAST_USERNAME),
            'error'         => $error,
        );
    }
    /**
     * @Route("registrati/", name="registrati")
     */
    public function registerAction(Request $request)
    {
        $user = new User();
        $form = $this->createForm(UserType::class, $user);

        $form->handleRequest($request);
        if ($form->isSubmitted() && $form->isValid()) {

            $password = $this->get('security.password_encoder')
                ->encodePassword($user, $user->getPassword());
            $user->setPassword($password);

            $now = new \DateTime();

            $user->setDatejoin($now);

            $user->setIsActive('0');

            $address = $form->get('address')->getData() . ' - ' . $form->get('cap')->getData() . ' - ' . $form->get('city')->getData() ;

            $user->setAddress($address);

            $user->setPoints('0');

            $user->setPhone('');

            $user->setCreditsGold(0);
            $user->setCreditsSilver(0);
            $user->setCreditsBronze(0);

            $user->setRoles("ROLE_USER");

            $user->setUsername($form->get('name')->getData());

            $code = uniqid('AUTH-',TRUE);
            $user->setCode($code);

            $em = $this->getDoctrine()->getManager();
            $em->persist($user);
            $em->flush();
            
            $this->createDummyProfileImage($user->getId());
            
            $userEmail = $form->get('email')->getData();

            $message = \Swift_Message::newInstance()
                ->setSubject('Benvenuto in VedoCompro.it')
                ->setFrom('noreply@vedocompro.it')
                ->setTo($userEmail)
                ->setBody(
                    $this->renderView(
                        'Emails/registration.html.twig',
                        array('name' => $form->get('name')->getData(),'code' =>$code)
                    ),
                    'text/html'
                )
            ;
            $this->get('mailer')->send($message);

            return $this->redirectToRoute('registrato');
        }

        return $this->render(
            'auth/register.html.twig',
            array('form' => $form->createView())
        );
    }

    public function CreateDummyProfileImage($uid) {
        $res = copy($_SERVER['DOCUMENT_ROOT'] ."/uploads/default_upic.jpg", $_SERVER['DOCUMENT_ROOT'] ."/uploads/profile/".$uid.".jpg");
        return $res;
    }

    /**
     * @Route("registrato/", name="registrato")
     */

    public function registerSuccessAction(Request $request)
    {
        return $this->render('auth/register.success.html.twig');
    }

    /**
     * @Route("verifica/{code}/", name="verifica", defaults={"code"=0})
     * @param $code
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function verifyAccountAction($code)
    {
        $user = new User;
        $result = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('p')
            ->select("p")
            ->where("p.code LIKE :code")
            ->setParameter('code', $code)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        var_dump($result);
        if ($result != '') {
            if ($result[0]['code'] == $code) {
                $id = $result[0]['id'];
                $em = $this->getDoctrine()->getManager();
                $user = $em->getRepository('AppBundle:User')->find($id);
                $user->setIsActive(1);
                $em->flush();
                return $this->render('auth/register.verify.html.twig');
            } else {
                $error = 'Il codice inserito non è corretto, prova a riaprire il link direttamente dalla mail.';
                return $this->render('auth/register.verify.html.twig', array(
                    'error' => $error
                ));
            }
        } else {
            $error = 'Il codice inserito non è corretto, prova a riaprire il link direttamente dalla mail.';
            return $this->render('auth/register.verify.html.twig', array(
                'error' => $error
            ));
        }
    }

}