<?php
/**
 * Created by PhpStorm.
 * User: andreaem
 * Date: 26/06/17
 * Time: 18:10
 */
include 'db.config.php';
$DB = new PDO('mysql:host=' . $DB_HOST . ';dbname=' . $DB_NAME,$DB_USER,$DB_PASS);

$ds = DIRECTORY_SEPARATOR;
if (!empty($_FILES)) {

    $date = date('U');

    $check = $DB->prepare("INSERT INTO `videos` (`id`, `aid`, `accepted`, `uid`, `dir`) VALUES (NULL, '', '', '', $date)");
    $check->execute();
    $check = $check->fetch(PDO::FETCH_ASSOC);

    mkdir_r($_SERVER['DOCUMENT_ROOT'] . $ds .'temp/'. $date, '0777');
    chmod($_SERVER['DOCUMENT_ROOT'] . $ds .'temp/'. $date, '0777');
    chown($_SERVER['DOCUMENT_ROOT'] . $ds .'temp/'. $date, 'andreaem');

    $uploadDir = 'temp/' . date('U');

    $tempFile = $_FILES['file']['tmp_name'];

    $targetPath = $_SERVER['DOCUMENT_ROOT'] . $ds . $uploadDir . $ds;

    $targetFile =  $targetPath. $_FILES['file']['name'];

    move_uploaded_file($tempFile,$targetFile);

    $_SESSION['video_dir'] = $date;

    print $date;

}

function mkdir_r($dirName, $rights=0777){
    $dirs = explode('/', $dirName);
    $dir='';
    foreach ($dirs as $part) {
        $dir.=$part.'/';
        if (!is_dir($dir) && strlen($dir)>0)
            mkdir($dir, $rights);
    }
}

print_r($_FILES);

