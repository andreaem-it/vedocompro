<?php

namespace AppBundle\Controller;

use AppBundle\AppBundle;
use AppBundle\Entity\Messages;
use AppBundle\Entity\Sells;
use AppBundle\Entity\User;
use AppBundle\Entity\Videos;
use Doctrine\ORM\Query;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Form\Extension\Core\Type\FileType;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class UploadVideoController extends Controller
{
    /**
     * @Route("uploadvideo", name="uploadvideo")
     */
    public function uploadVideoAction()
    {
        $target_dir = __DIR__ . "/../../../web/webtemp/";

        set_time_limit(0);
        ini_set('upload_max_filesize', '200M');
        ini_set('post_max_size', '201M');
        ini_set('max_input_time', 3200);
        ini_set('max_execution_time', 3200);
        ini_set('memory_limit', '256M');

        try {

            // Undefined | Multiple Files | $_FILES Corruption Attack
            // If this request falls under any of them, treat it invalid.
            if (
                !isset($_FILES['file']['error']) ||
                is_array($_FILES['file']['error'])
            ) {
                throw new RuntimeException('Invalid parameters.');
            }

            // Check $_FILES['file']['error'] value.
            switch ($_FILES['file']['error']) {
                case UPLOAD_ERR_OK:
                    break;
                case UPLOAD_ERR_NO_FILE:
                    throw new RuntimeException('No file sent.');
                    break;
                case UPLOAD_ERR_INI_SIZE:
                    break;
                case UPLOAD_ERR_FORM_SIZE:
                    throw new RuntimeException('Exceeded filesize limit.');
                    break;
                default:
                    throw new RuntimeException('Unknown errors.');
                    break;
            }

            // You should also check filesize here.
            if ($_FILES['file']['size'] > 209715200) {
                throw new RuntimeException('Exceeded filesize limit.');
            }

            // DO NOT TRUST $_FILES['file']['mime'] VALUE !!
            // Check MIME Type by yourself.
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            if (false === $ext = array_search(
                    $finfo->file($_FILES['file']['tmp_name']),
                    array(
                        'mp4' => 'video/mp4',
                        'mov' => 'video/mov',
                        'avi' => 'video/avi',
                        'mov' => 'video/mov',
                    ),
                    true
                )) {
                throw new RuntimeException('Invalid file format.');
            }

            // You should name it uniquely.
            // DO NOT USE $_FILES['file']['name'] WITHOUT ANY VALIDATION !!
            // On this example, obtain safe unique name from its binary data.
            $fileName = sha1_file($_FILES['file']['tmp_name']);
            if (!move_uploaded_file($_FILES['file']['tmp_name'], sprintf('%s%s.%s', $target_dir, $fileName, $ext ))) {
                throw new RuntimeException('Failed to move uploaded file.');
            }
            return new Response(sprintf("%s.%s",$fileName,$ext), 200, ['Content-Type', 'text/plain; charset=utf-8']);
        } catch (RuntimeException $e) {
            throw new \Exception($e->getMessage());
        }
    }
}