<?php

namespace AppBundle\Controller;

use AppBundle\Form\UserType;
use AppBundle\Form\PasswordResetType;
use AppBundle\Entity\User;
use function PHPSTORM_META\type;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\PasswordType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
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

            $user->setCreditsGold(0);
            $user->setCreditsSilver(0);
            $user->setCreditsBronze(0);

            $user->setRoles("ROLE_USER");

            $user->setUsername($form->get('name')->getData());

            $user->setConfirmationToken('');
            $user->setPasswordRequestedAt($now);
            $user->setPlainPassword('');

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
     * @return Response
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

    /**
     * @Route("reset-password/", name="reset-password")
     * @return Response
     */
    public function resetPasswordAction(Request $request) {

        $user = new User();

        $resetForm = $this->createFormBuilder($user)
                     ->add('email',EmailType::class, [
                         'label' => 'E-Mail'
                     ])
                     ->add('submit',SubmitType::class,[
                         'label' => 'Ripristina',
                         'attr' => [
                             'class' => 'btn btn-primary btn-block btn-lg'
                         ]
                     ])
                     ->getForm();

        $resetForm->submit($request->request->all(), false);

        if($_POST) { $mail = $_POST['form']['email']; }

        if($resetForm->isSubmitted() && $_POST) {

            // && $this->captchaverify($request->get('g-recaptcha-response'))

            $check = $this->getDoctrine()->getRepository('AppBundle:User')->findBy(['email' =>$mail]);

            if($check) {
                $token = uniqid('RESET-', true);

                $em = $this->getDoctrine()->getManager();
                $user = $em->getRepository(User::class)->findOneBy(['email' => $mail]);
                $user->setConfirmationToken($token);
                $user->setPasswordRequestedAt(new \DateTime());

                $em->flush();

                $message = \Swift_Message::newInstance()
                    ->setSubject('Reset della password di VedoCompro.it')
                    ->setFrom('noreply@vedocompro.it')
                    ->setTo($mail)
                    ->setBody(
                        $this->renderView(
                            'Emails/pass.reset.html.twig',
                            array('name' => $mail,'code' =>$token)
                        ),
                        'text/html'
                    )
                ;
                $this->get('mailer')->send($message);

                return $this->render('auth/reset.sended.html.twig',[
                    'mail' => $mail,
                    'token' => $token
                ]);
            }
        }

        return $this->render('auth/reset.html.twig',[
            'error' => '',
            'form_reset' => $resetForm->createView()
        ]);
    }

    /**
     * @Route("reset-password/{token}", name="reset-password-new")
     */
    public function resetPasswordNewAction(Request $request,$token) {

        $user = new User();
        $check = $this->getDoctrine()->getManager()->getRepository('AppBundle:User')->findOneBy(['confirmation_token' => $token]);

        if($token == $check->getConfirmationToken()) {
            $form = $this->createFormBuilder($user)
                ->add('plainPassword',PasswordType::class,[
                    'label' => 'Nuova Password'
                ])
                ->add('rePassword', PasswordType::class, [
                    'label' => 'Reinserisci Password'
                ])
                ->add('submit',SubmitType::class, [
                    'label' => 'Ripristina',
                    'attr' => [
                        'class' => 'btn btn-primary btn-block btn-lg'
                    ]
                ])
                ->getForm();

            $form->submit($request->request->all(), false);

            //if ($form->isValid()) {
                if ($_POST) {
                    $user->setConfirmationToken(null);
                    $user->setPasswordRequestedAt(null);
                    $plainPassword = $_POST['form']['plainPassword'];
                    $encoder = $this->get('security.encoder_factory')->getEncoder($user);
                    $encodedPassword = $encoder->encodePassword($user,$plainPassword);
                    $user->setPassword($encodedPassword);
                    $em = $this->getDoctrine()->getManager();
                    $em->flush();

                    return $this->render('auth/reset.success.html.twig');
                }
            //}

            return $this->render('auth/reset.new.html.twig',[
                'error' => '',
                'form' => $form->createView()
            ]);
        } else {
            $this->addFlash('string','Il token non è corretto, si prega di seguire il link nella mail');
            return $this->render('default/error.html.twig', [
                'error_title' => 'Token non corretto',
                'error_body' => 'Il token non è corretto, si prega di seguire il link nella mail'
            ]);
        }




    }

    /**
     * @Route("reset-password/conferma", name="reset-password-confirm")
     */
    public function resetPasswordConfirmAction() {
        return $this->render('auth/reset.success.html.twig');
    }

    function captchaverify($recaptcha){
        $url = "https://www.google.com/recaptcha/api/siteverify";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, array(
            "secret"=>"6LeTXQgUAAAAALExcpzgCxWdnWjJcPDoMfK3oKGi","response"=>$recaptcha));
        $response = curl_exec($ch);
        curl_close($ch);
        $data = json_decode($response);

        return $data->success;
    }
}