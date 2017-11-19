<?php

namespace AppBundle\Controller;

use AppBundle\Entity\AdminActions;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Doctrine\ORM\QueryBuilder;
use Doctrine\ORM\EntityRepository;
use AppBundle\Entity\User;

class AdminController extends Controller
{
    /**
     * @Route("/admin", name="admin")
     */
    public function adminAction()
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');
        $page = 1;

        $actions = $this->getDoctrine()
                ->getRepository('AppBundle:AdminActions')
                ->createQueryBuilder('e')
                ->select('e')
                ->orderBy('e.linedate', 'DESC')
                ->setMaxResults('20')
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $getLines = $this->getDoctrine()
                ->getRepository('AppBundle:AdminActions')
                ->createQueryBuilder('e')
                ->select('count(e)')
                ->getQuery()
                ->getSingleScalarResult();
        $pages = ceil($getLines / 20);

        $adsCount = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->getQuery()
            ->getSingleScalarResult();

        $activeUsersCount = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->where('e.enabled = 1')
            ->getQuery()
            ->getSingleScalarResult();

            if (!isset($_SESSION['visited'])):

            $now = $time = new \DateTime();
            $action = new AdminActions();
            $action->setLinedate($now);
            $action->setType(1);
            $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

            $em = $this->getDoctrine()->getManager();
            $em->persist($action);
            $em->flush();

            endif; $_SESSION['visited'] = true;


        return $this->render('admin/index.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'adminActions' => $actions,
            'adminActionsPages' => $pages,
            'adsCount' => $adsCount,
            'activeUsersCount' => $activeUsersCount,
            'tools' => $this
    ));
    }
    /**
     * @Route("/admin/actions/{page}", name="admin_act",  defaults={"page" = 1})
     */
    public function adminActionsAction($page)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        if($page != 1){
            $results = 20 * ($page - 1);
            $actions = $this->getDoctrine()
                ->getRepository('AppBundle:AdminActions')
                ->createQueryBuilder('e')
                ->select('e')
                ->orderBy('e.linedate', 'DESC')
                ->setFirstResult($results)
                ->setMaxResults('20')
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        } else {
            $actions = $this->getDoctrine()
                ->getRepository('AppBundle:AdminActions')
                ->createQueryBuilder('e')
                ->select('e')
                ->orderBy('e.linedate', 'DESC')
                ->setMaxResults('20')
                ->getQuery()
                ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        }
        $getLines = $this->getDoctrine()
            ->getRepository('AppBundle:AdminActions')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->getQuery()
            ->getSingleScalarResult();
        $pages = ceil($getLines / 20);

        $adsCount = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->where('e.published = 1')
            ->getQuery()
            ->getSingleScalarResult();

        $activeUsersCount = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('count(e)')
            ->where('e.enabled = 1')
            ->getQuery()
            ->getSingleScalarResult();

        if (!isset($_SESSION['visited'])):

            $now = $time = new \DateTime();
            $action = new AdminActions();
            $action->setLinedate($now);
            $action->setType(1);
            $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

            $em = $this->getDoctrine()->getManager();
            $em->persist($action);
            $em->flush();

        endif; $_SESSION['visited'] = true;


        return $this->render('admin/index.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'adminActions' => $actions,
            'adminActionsPages' => $pages,
            'adsCount' => $adsCount,
            'activeUsersCount' => $activeUsersCount,
            'tools' => $this
        ));
    }
    /**
     * @Route("/admin/inserzioni", name="admin_inserzioni")
     */
    public function adsAction()
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');
        $ads = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('e')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render('admin/views/ads.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'ads' => $ads,
            'tools' => $this
        ));
    }

    /**
     * @Route("/admin/inserzioni/vedi/{id}", name="admin_vedi_inserzioni")
     */
    public function adsViewAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');
        $ad = $this->getDoctrine()
            ->getRepository('AppBundle:Ads')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.id = :id')
            ->setParameter('id',$id)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render('admin/views/ads.view.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'ad' => $ad,
            'tools' => $this
        ));
    }

    /**
     * @Route("/admin/utenti/", name="admin_utenti")
     */
    public function usersAction()
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');
        $users = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render(':admin/views:users.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'users' => $users));
    }

    /**
     * @Route("/admin/utenti/activate/{id}", name="admin_utenti_activate")
     */
    public function usersActivateAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $user = $em->getRepository('AppBundle:User')->find($id);

        $user->setEnabled(true);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(2);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_utenti');
    }

    /**
     * @Route("/admin/video/deactivate/{id}", name="admin_video_deactivate")
     */
    public function usersDectivateAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $user = $em->getRepository('AppBundle:Ads')->find($id);

        $user->setPublished(0);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(5);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_video');
    }

    /**
     * @Route("/admin/video/activate/{id}", name="admin_video_activate")
     */
    public function videoActivateAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $user = $em->getRepository('AppBundle:Ads')->find($id);

        $user->setPublished(1);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(6);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_video');
    }

    /**
     * @Route("/admin/utenti/deactivate/{id}", name="admin_utenti_deactivate")
     */
    public function videoDectivateAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $user = $em->getRepository('AppBundle:User')->find($id);

        $user->setEnabled(false);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(7);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_utenti');
    }

    /**
     * @Route("/admin/utenti/delete/{id}", name="admin_utenti_delete")
     */
    public function usersDeleteAction($id)
    {
        $this->denyAccessUnlessGranted('ROLE_SUPPORT', null, 'Unable to access this page!');

        $em = $this->getDoctrine()->getManager();
        $user = $em->getRepository('AppBundle:User')->find($id);

        $em->remove($user);
        $em->flush();

        $now = $time = new \DateTime();

        $action = new AdminActions();
        $action->setLinedate($now);
        $action->setType(5);
        $action->setUid($this->get('security.token_storage')->getToken()->getUser()->getID());

        $em = $this->getDoctrine()->getManager();
        $em->persist($action);
        $em->flush();

        return $this->redirectToRoute('admin_utenti');
    }

    /**
     * @Route("/admin/utenti/{id}", name="admin_utenti_vedi")
     */
    public function usersViewAction($id)
    {
        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render(':admin/views:users.view.html.twig',array(
            'user' => $user,
            'admin_info' => $this->getAdminInfos()));
    }

    /**
     * @Route("/admin/video/", name="admin_video")
     */
    public function videoAction()
    {
        //$videos = $this->getDirContents($_SERVER['SERVER_ADDR'] . '/webtemp');

        $videos = array_diff(scandir('/var/www/html/beta.vedocompro.it/web/webtemp'),array('..','.'));

        return $this->render(':admin/views:video.mod.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'videos' => $videos,
            'functions' => $this));
    }

    /**
     * @Route("/admin/video/{id}/{video_uri}", name="admin_video_view")
     * @param $video_uri
     * @return Response
     * @internal param $id
     */
    public function videoViewAction($id,$video_uri)
    {

        return $this->render(':admin/views:video.view.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'video_uri' => $video_uri,
            'key' => $id));
    }

    /**
     * @Route("/admin/mail/", name="admin_mail")
     */
    public function mailAction(Request $request)
    {
        $default = array();
        $form = $this->createFormBuilder($default)
            ->add('to',EmailType::class)
            ->add('from',ChoiceType::class, array(
                'choices' => array(
                    'no-reply @ vedocompro.it'=> 'no-reply@vedocompro.it',
                    'admin @ vedocompro.it' => 'admin@vedocompro.it'
                )))
            ->add('subject',TextType::class)
            ->add('message',TextareaType::class,array(
                'attr' => array(
                    'rows' => 20
                )
            ))
            ->add('submit',SubmitType::class,array(
                'attr' => array(
                    'class' => 'btn btn-success btn-lg pull-right'
                )
            ))
            ->getForm();

        $form->handleRequest($request);

        if($form->isValid()) {
            $to = $form->get('to')->getData();
            $from = $form->get('from')->getData();
            $subject = $form->get('subject')->getData();
            $message = $form->get('message')->getData();

            $message = \Swift_Message::newInstance()
                ->setSubject($subject)
                ->setFrom($from)
                ->setTo($to)
                ->setBody(
                    $this->renderView(
                        'Emails/message.blank.html.twig',
                        array('message' => $message,'subject' => $subject)
                    ),
                    'text/html'
                )
            ;
            $this->get('mailer')->send($message);
            $this->addFlash(
                'notice',
                'Messaggio inviato!'
            );
            return $this->render(':admin/views:mail.html.twig',array(
                'form' => $form->createView(),
                'success' => $success = 1,
                'admin_info' => $this->getAdminInfos()));
        }
        return $this->render(':admin/views:mail.html.twig',array(
            'form' => $form->createView(),
            'success' => $success = 0,
            'admin_info' => $this->getAdminInfos()));
    }

    /**
     * @Route("/admin/coupons/", name="admin_coupons")
     */
    public function couponsAction()
    {
        $coupons = $this->getDoctrine()
            ->getRepository('AppBundle:Coupons')
            ->createQueryBuilder('e')
            ->select('e')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render(':admin/views:coupons.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'coupons' => $coupons));
    }

    /**
     * @Route("/admin/coupons/genera", name="admin_coupons_genera")
     */
    public function couponsGenAction()
    {
        return $this->render(':admin/views:coupons.generate.html.twig',array(
            'admin_info' => $this->getAdminInfos()));
    }

    /**
     * @Route("/admin/helpdesk/", name="admin_helpdesk")
     */
    public function helpdeskAction()
    {
        $ticketsOpen = $this->getDoctrine()->getRepository('AppBundle:HelpDesk')
                            ->createQueryBuilder('e')->select('e')->where('e.closed = 0')->andWhere('e.parent_m = 0')
                            ->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        $ticketsClosed = $this->getDoctrine()->getRepository('AppBundle:HelpDesk')
                            ->createQueryBuilder('e')->select('e')->where('e.closed = 1')
                            ->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        $ticketsAssigned = $this->getDoctrine()->getRepository('AppBundle:HelpDesk')
                            ->createQueryBuilder('e')->select('e')->where('e.closed = 2')
                            ->getQuery()->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        $countTO = count($ticketsOpen);
        $countTC = count($ticketsClosed);
        $countTA = count($ticketsAssigned);

        return $this->render(':admin/views:helpdesk.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'tools' => $this,
            'ticketsOpen' => $ticketsOpen,
            'ticketsClosed' => $ticketsClosed,
            'ticketsAssigned' => $ticketsAssigned,
            'countTO' => $countTO,
            'countTC' => $countTC,
            'countTA' => $countTA));
    }

    /**
     * @Route("/admin/suggerimenti/", name="admin_suggerimenti")
     */
    public function suggestsAction()
    {
        $suggests = $this->getDoctrine()
            ->getRepository('AppBundle:Suggests')
            ->createQueryBuilder('e')
            ->select('e')
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);

        return $this->render(':admin/views:suggests.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'suggests' => $suggests));
    }

    /**
     * @Route("/admin/sistema/", name="admin_sistema")
     */
    public function systemAction()
    {
        $info = array(
            'server_name' => $_SERVER['SERVER_NAME'] . ':' . $_SERVER['SERVER_PORT'],
            'server_host' => $_SERVER['HTTP_HOST'],
            'server_sftw' => $_SERVER['SERVER_SOFTWARE'],
            'php_ini' =>  php_ini_loaded_file(),
            'php_version' => phpversion(),
            'php_max_execution_time' => ini_get('max_execution_time'),
            'php_upload_temp_dir' => ini_get('upload_tmp_dir'),
            'php_upload_max_filesize' => ini_get('upload_max_filesize'),
            'php_post_max_size' => ini_get('post_max_size'),

    );

        return $this->render(':admin/views:system.html.twig',array(
            'admin_info' => $this->getAdminInfos(),
            'info' => $info));
    }

    /**
     * @Route("/admin/lock", name="admin_lock")
     */
    public function lockAction() {

        return $this->render(':admin/views:lock.html.twig',array(
            'currentUser' => $this->get('security.token_storage')->getToken()->getUser()->getID(),
            'tools' => $this
        ));
    }

    public function getAdminInfos() {
        $adminName = $this->get('security.token_storage')->getToken()->getUser();
        $admin = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.id = :adminName')
            ->setParameter(':adminName', $adminName)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        return $admin;
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
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
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
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
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
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
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
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        return $catname[0]["name"];
    }
    public function convertLevel($level)
    {
        switch ($level) {
            case '0':
                return 'Nessuno';
                break;
            case '1':
                return 'Oro';
                break;
            case '2':
                return 'Argento';
                break;
            case '3':
                return 'Bronzo';
                break;
            default:
                return 'Nessuno';
                break;
        }
    }
    public function convertAccessType($id,$switch) {
        $type = $this->getDoctrine()
            ->getRepository('AppBundle:AdminTypes')
            ->createQueryBuilder('e')
            ->select('e')
            ->where('e.id = :id')
            ->setParameter('id', $id)
            ->getQuery()
            ->getResult(\Doctrine\ORM\Query::HYDRATE_ARRAY);
        switch ($switch) {
            case 1:
                return $type[0]['name'];
                break;
            case 2:
                return $type[0]['description'];
                break;
        }

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

    public function checkExt($ext) {
        if (strpos($ext, '.mp4') !== false) {
            return 1;
        } else {
            return 1;
        }
    }

    public function getBasename($string) {
        return basename($string);
    }

    public function array_fill_keys($array) {
        return array_fill_keys($array);
    }

    function getDirContents($dir, &$results = array()){
        $files = scandir($dir);

        foreach($files as $key => $value){
            $path = realpath($dir.DIRECTORY_SEPARATOR.$value);
            if(!is_dir($path)) {
                $results[] = $path;
            } else if($value != "." && $value != "..") {
                $this::getDirContents($path, $results);
                $results[] = $path;
            }
        }

        return $results;
    }
}

class scanDir {
    static private $directories, $files, $ext_filter, $recursive;

// ----------------------------------------------------------------------------------------------
    // scan(dirpath::string|array, extensions::string|array, recursive::true|false)
    static public function scan(){
        // Initialize defaults
        self::$recursive = false;
        self::$directories = array();
        self::$files = array();
        self::$ext_filter = false;

        // Check we have minimum parameters
        if(!$args = func_get_args()){
            die("Must provide a path string or array of path strings");
        }
        if(gettype($args[0]) != "string" && gettype($args[0]) != "array"){
            die("Must provide a path string or array of path strings");
        }

        // Check if recursive scan | default action: no sub-directories
        if(isset($args[2]) && $args[2] == true){self::$recursive = true;}

        // Was a filter on file extensions included? | default action: return all file types
        if(isset($args[1])){
            if(gettype($args[1]) == "array"){self::$ext_filter = array_map('strtolower', $args[1]);}
            else
                if(gettype($args[1]) == "string"){self::$ext_filter[] = strtolower($args[1]);}
        }

        // Grab path(s)
        self::verifyPaths($args[0]);
        return self::$files;
    }

    static private function verifyPaths($paths){
        $path_errors = array();
        if(gettype($paths) == "string"){$paths = array($paths);}

        foreach($paths as $path){
            if(is_dir($path)){
                self::$directories[] = $path;
                $dirContents = self::find_contents($path);
            } else {
                $path_errors[] = $path;
            }
        }

        if($path_errors){echo "The following directories do not exists<br />";die(var_dump($path_errors));}
    }

    // This is how we scan directories
    static private function find_contents($dir){
        $result = array();
        $root = scandir($dir);
        foreach($root as $value){
            if($value === '.' || $value === '..') {continue;}
            if(is_file($dir.DIRECTORY_SEPARATOR.$value)){
                if(!self::$ext_filter || in_array(strtolower(pathinfo($dir.DIRECTORY_SEPARATOR.$value, PATHINFO_EXTENSION)), self::$ext_filter)){
                    self::$files[] = $result[] = $dir.DIRECTORY_SEPARATOR.$value;
                }
                continue;
            }
            if(self::$recursive){
                foreach(self::find_contents($dir.DIRECTORY_SEPARATOR.$value) as $value) {
                    self::$files[] = $result[] = $value;
                }
            }
        }
        // Return required for recursive search
        return $result;
    }
}